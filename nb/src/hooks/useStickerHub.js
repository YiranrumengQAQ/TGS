/**
 * useStickerHub — React port of the M3 app's TGStickerApp controller.
 *
 * Owns: token, polling loop (getUpdates long-poll), received media list,
 * history persistence, sticker-set fetching, ZIP packing, downloads.
 * `notify(msg, variant)` is injected by App (wired to the Snackbar stack).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { TokenManager } from '../lib/tokenManager';
import { TGBotCore } from '../lib/tgCore';
import { MediaParser } from '../lib/mediaParser';
import { DownloadManager } from '../lib/downloadManager';
import { cancelRic, extOf, ric, sleep } from '../lib/utils';

const HISTORY_KEY = 'tg_sticker_history_nb';
const MAX_HISTORY = 30;

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : [];
    } catch (_) {
        return [];
    }
}

function saveHistory(list) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
    } catch (_) {}
}

export function useStickerHub({ notify }) {
    const [token, setToken] = useState(() => TokenManager.get() || '');
    const [status, setStatus] = useState(() =>
        TokenManager.get()
            ? { state: 'offline', text: '已加载令牌，点击开始' }
            : { state: 'offline', text: '未连接' },
    );
    const [isPolling, setIsPolling] = useState(false);
    const [lastPoll, setLastPoll] = useState(null);
    const [mediaList, setMediaList] = useState(loadHistory);
    // highlight the newest restored card on load (single active card)
    const [activeId, setActiveId] = useState(() => {
        const h = loadHistory();
        return h.length ? `${h[0].fileId}:${h[0].timestamp}` : null;
    });
    const [sets, setSets] = useState({}); // fileId → { status:'loading'|'ready'|'error', data?, error?, name? }
    const [zip, setZip] = useState({ fileId: null, progress: 0, packing: false });

    const botRef = useRef(null);
    const pollingRef = useRef(false);
    const processedRef = useRef(new Set());
    const zipPackingRef = useRef(false);
    const notifyRef = useRef(notify);
    notifyRef.current = notify;

    // ── history persistence (idle-time write, off the main hot path) ──
    useEffect(() => {
        const id = ric(() => saveHistory(mediaList));
        return () => cancelRic(id);
    }, [mediaList]);

    const addMedia = useCallback((m) => {
        setMediaList((prev) => [m, ...prev].slice(0, MAX_HISTORY));
        setActiveId(`${m.fileId}:${m.timestamp}`);
    }, []);

    // ── polling internals ──────────────────────────────────────────────
    const stopInternal = useCallback(() => {
        pollingRef.current = false;
        const b = botRef.current;
        if (b) b.abort(); // kill the in-flight getUpdates (up to 30s long-poll)
        botRef.current = null;
        setIsPolling(false);
        setLastPoll(null);
        setStatus((s) => (s.state === 'offline' ? s : { state: 'offline', text: '已停止' }));
    }, []);

    // Only re-render when the status actually changed (the poll loop
    // reports 监听中 on every successful cycle — no need to re-render all).
    const setStableStatus = useCallback((state, text) => {
        setStatus((s) => (s.state === state && s.text === text ? s : { state, text }));
    }, []);

    const start = useCallback(
        (tk) => {
            if (pollingRef.current) return false; // double-click guard
            tk = (tk || '').trim();
            if (!tk) {
                notifyRef.current?.('请输入 Bot Token');
                return false;
            }
            if (!tk.includes(':')) {
                notifyRef.current?.('Token 格式不正确');
                return false;
            }
            TokenManager.save(tk);
            setToken(tk);

            const bot = new TGBotCore(tk);
            botRef.current = bot;
            bot.isPolling = true;
            pollingRef.current = true;
            processedRef.current.clear();
            setIsPolling(true);
            setStatus({ state: 'online', text: '正在连接…' });

            (async () => {
                while (pollingRef.current && botRef.current === bot) {
                    try {
                        const updates = await bot.request(
                            'getUpdates',
                            { offset: bot.lastUpdateId + 1, timeout: 20 },
                            30000,
                        );
                        if (!pollingRef.current || botRef.current !== bot) break;
                        bot.consecutiveErrors = 0;
                        setStableStatus('online', '监听中');

                        for (const update of updates) {
                            bot.lastUpdateId = update.update_id;
                            if (!update.message) continue;
                            try {
                                const info = await MediaParser.parseMessage(bot, update.message);
                                if (info && info.fileId && !processedRef.current.has(info.fileId)) {
                                    processedRef.current.add(info.fileId);
                                    if (processedRef.current.size > 500) processedRef.current.clear();
                                    addMedia(info);
                                }
                            } catch (parseErr) {
                                console.warn('解析消息失败:', parseErr.message);
                            }
                        }
                        setLastPoll(Date.now());
                    } catch (error) {
                        if (!pollingRef.current || botRef.current !== bot) break;
                        if (error.name === 'AbortError') break; // user stopped — not an error
                        bot.consecutiveErrors += 1;
                        console.error('轮询错误:', error.message);

                        if (error.code === 401 || error.code === 403) {
                            setStatus({ state: 'error', text: 'Token 无效' });
                            notifyRef.current?.('Token 无效，请检查后重试', 'error');
                            stopInternal();
                            break;
                        }
                        if (bot.consecutiveErrors > 10) {
                            setStatus({ state: 'error', text: '连续错误过多，已暂停' });
                            stopInternal();
                            break;
                        }
                        const wait = Math.min(3000 * bot.consecutiveErrors, 30000);
                        setStatus({ state: 'error', text: `重试 (${Math.round(wait / 1000)}s)` });
                        await sleep(wait);
                    }
                }
            })();
            return true;
        },
        [addMedia, stopInternal, setStableStatus],
    );

    const stop = useCallback(() => {
        stopInternal();
        notifyRef.current?.('已停止监听');
    }, [stopInternal]);

    // visibility: reset error counter when the tab comes back (parity w/ M3)
    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === 'visible' && pollingRef.current && botRef.current) {
                botRef.current.consecutiveErrors = 0;
                setStatus((s) => (s.state === 'error' ? { state: 'online', text: '监听中' } : s));
            }
        };
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    // unmount cleanup
    useEffect(
        () => () => {
            pollingRef.current = false;
            botRef.current = null;
        },
        [],
    );

    // ── clear history ──────────────────────────────────────────────────
    const clearHistory = useCallback(() => {
        zipPackingRef.current = false; // abort an in-flight pack loop
        setMediaList([]);
        setSets({});
        setActiveId(null);
        setZip({ fileId: null, progress: 0, packing: false });
        processedRef.current.clear();
        notifyRef.current?.('历史已清除');
    }, []);

    // ── media actions ──────────────────────────────────────────────────
    const pickMedia = useCallback((m) => {
        setActiveId(`${m.fileId}:${m.timestamp}`);
    }, []);

    const downloadOriginal = useCallback(
        (m) => {
            DownloadManager.triggerDownload(m.originalUrl, `sticker_${m.fileId.slice(0, 12)}.${extOf(m.type)}`);
            notifyRef.current?.('开始下载');
        },
        [],
    );

    const convertPng = useCallback(async (m) => {
        try {
            const dataUrl = await DownloadManager.convertWebpToPng(m.originalUrl);
            DownloadManager.triggerDownload(dataUrl, `sticker_${m.fileId.slice(0, 12)}.png`);
            notifyRef.current?.('PNG 下载开始', 'success');
            return true;
        } catch (e) {
            notifyRef.current?.('转换失败: ' + e.message, 'error');
            return false;
        }
    }, []);

    const copyLink = useCallback(async (m) => {
        try {
            await navigator.clipboard.writeText(m.originalUrl);
        } catch (_) {
            try {
                const ta = document.createElement('textarea');
                ta.value = m.originalUrl;
                ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            } catch (__) {}
        }
        notifyRef.current?.('已复制链接');
    }, []);

    // ── sticker sets ───────────────────────────────────────────────────
    const loadSet = useCallback(async (fileId, setName) => {
        const bot = botRef.current;
        if (!bot) {
            notifyRef.current?.('Bot 未初始化');
            return;
        }
        setSets((s) => ({ ...s, [fileId]: { status: 'loading' } }));
        try {
            const setInfo = await bot.getStickerSet(setName);
            if (!setInfo) throw new Error('未找到套装');
            const stickers = await Promise.all(
                setInfo.stickers.map(async (st) => {
                    const url = await bot.getFileUrl(st.file_id);
                    let thumbUrl = null;
                    if (st.thumbnail) {
                        try {
                            thumbUrl = await bot.getFileUrl(st.thumbnail.file_id);
                        } catch (_) {}
                    }
                    return {
                        fileId: st.file_id,
                        url,
                        thumbUrl,
                        emoji: st.emoji || null,
                        type: st.is_animated ? 'tgs' : st.is_video ? 'webm' : 'webp',
                    };
                }),
            );
            if (!botRef.current) return; // stopped in the meantime
            setSets((s) => ({
                ...s,
                [fileId]: { status: 'ready', data: { title: setInfo.title, stickers }, name: setName },
            }));
        } catch (e) {
            setSets((s) => ({ ...s, [fileId]: { status: 'error', error: e.message, name: setName } }));
        }
    }, []);

    const setsRef = useRef(sets);
    useEffect(() => {
        setsRef.current = sets;
    }, [sets]);

    const closeSet = useCallback((fileId) => {
        setSets((s) => {
            const next = { ...s };
            delete next[fileId];
            return next;
        });
    }, []);

    const toggleSet = useCallback(
        (fileId, setName) => {
            const cur = setsRef.current[fileId];
            if (cur && cur.status !== 'loading') {
                closeSet(fileId);
                return;
            }
            loadSet(fileId, setName);
        },
        [closeSet, loadSet],
    );

    // ── downloads from a set ───────────────────────────────────────────
    const downloadOne = useCallback((st) => {
        DownloadManager.triggerDownload(st.url, `sticker_${st.fileId.slice(0, 10)}.${extOf(st.type)}`);
        notifyRef.current?.(`下载: ${st.type.toUpperCase()}`);
    }, []);

    const downloadAll = useCallback(async (stickers) => {
        notifyRef.current?.('开始逐个下载...');
        for (let i = 0; i < stickers.length; i++) {
            const s = stickers[i];
            await sleep(i === 0 ? 100 : 400);
            DownloadManager.triggerDownload(s.url, `sticker_${s.fileId.slice(0, 10)}.${extOf(s.type)}`);
        }
        notifyRef.current?.('全部下载已触发', 'success');
    }, []);

    const packZip = useCallback(async (fileId) => {
        const cur = setsRef.current[fileId];
        if (!cur || !cur.data) return;
        if (zipPackingRef.current) {
            notifyRef.current?.('正在打包中…');
            return;
        }
        const { stickers } = cur.data;
        zipPackingRef.current = true;
        setZip({ fileId, progress: 0, packing: true });

        const zip = new JSZip();
        let done = 0;
        let failed = 0;
        let cancelled = false;
        for (const st of stickers) {
            // set collapsed / history cleared mid-pack → stop fetching
            if (!setsRef.current[fileId]) {
                cancelled = true;
                break;
            }
            try {
                const resp = await fetch(st.url);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const blob = await resp.blob();
                zip.file(`sticker_${st.fileId.slice(0, 10)}.${extOf(st.type)}`, blob);
            } catch (e) {
                failed++;
                console.warn('打包失败:', st.fileId, e.message);
            }
            done++;
            setZip({ fileId, progress: Math.round((done / stickers.length) * 100), packing: true });
        }
        if (cancelled) {
            zipPackingRef.current = false;
            setZip((z) => ({ ...z, packing: false }));
            return;
        }

        if (stickers.length - failed === 0) {
            notifyRef.current?.('所有文件获取失败', 'error');
        } else {
            try {
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                DownloadManager.triggerDownload(url, `sticker_set_${Date.now()}.zip`);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
                notifyRef.current?.(`打包完成 (成功 ${stickers.length - failed}/${stickers.length})`, 'success');
            } catch (e) {
                notifyRef.current?.('打包失败: ' + e.message, 'error');
            }
        }
        zipPackingRef.current = false;
        setZip((z) => ({ ...z, packing: false }));
    }, []);

    // ── Escape closes open sets (parity w/ M3) ─────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && Object.keys(setsRef.current).length) {
                setSets({});
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return {
        token,
        setToken,
        status,
        isPolling,
        lastPoll,
        mediaList,
        activeId,
        sets,
        zip,
        start,
        stop,
        clearHistory,
        pickMedia,
        downloadOriginal,
        convertPng,
        copyLink,
        toggleSet,
        loadSet,
        downloadOne,
        downloadAll,
        packZip,
    };
}

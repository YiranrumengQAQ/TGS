/**
 * Sticker Hub · Neo-Brutalism — root component.
 * `host` is injected by the patch overlay (window.__NB_HOST__) and powers
 * the "back to Material 3" exit; standalone mode passes null.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { Card, CardHeader } from './components/Card';
import { Button, IconButton } from './components/Button';
import { TextField } from './components/TextField';
import { StatusBadge } from './components/StatusBadge';
import { EmptyState } from './components/EmptyState';
import { MediaCard } from './components/MediaCard';
import { HistoryList } from './components/HistoryList';
import { SnackbarStack } from './components/Snackbar';
import { useTheme } from './hooks/useTheme';
import { useStickerHub } from './hooks/useStickerHub';
import { fmtTime } from './lib/utils';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';

let toastSeq = 0;

export default function App({ host = null }) {
    const { theme, toggleTheme } = useTheme();
    const [toasts, setToasts] = useState([]);

    const notify = useCallback((msg, variant = 'default') => {
        const id = ++toastSeq;
        setToasts((t) => [...t.slice(-3), { id, msg, variant }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700);
    }, []);
    const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const hub = useStickerHub({ notify });

    const [visible, setVisible] = useState(false);
    const [convertingId, setConvertingId] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const confirmTimer = useRef(null);
    const tokenInputRef = useRef(null);
    const listRef = useRef(null);

    // ── scroll newest card into view (skip the initial restore) ───────
    const lastMediaId = useRef(null);
    useEffect(() => {
        const newest = hub.mediaList[0];
        const id = newest ? `${newest.fileId}:${newest.timestamp}` : null;
        if (id && id !== lastMediaId.current && lastMediaId.current !== null) {
            const el = listRef.current?.querySelector(`[data-media-id="${CSS.escape(id)}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        lastMediaId.current = id;
    }, [hub.mediaList]);

    // ── performance: pause videos that scroll out of view ─────────────
    // (keeps the GPU/CPU/battery load down when many mp4/gif cards are
    //  stacked; resumes automatically when scrolled back into view)
    useEffect(() => {
        const root = listRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        if (video.dataset.wasPlaying === '1') video.play().catch(() => {});
                    } else if (!video.paused && !video.ended) {
                        video.dataset.wasPlaying = '1';
                        video.pause();
                    }
                }
            },
            { root: null, threshold: 0.05 },
        );
        const watch = () => root.querySelectorAll('video').forEach((v) => io.observe(v));
        watch();
        const mo = new MutationObserver(watch);
        mo.observe(root, { childList: true, subtree: true });
        return () => {
            io.disconnect();
            mo.disconnect();
        };
    }, []);

    // ── start / stop ──────────────────────────────────────────────────
    const handleStart = useCallback(() => {
        const ok = hub.start(hub.token);
        if (ok) notify('已启动监听');
        else tokenInputRef.current?.focus();
    }, [hub, notify]);

    const handleStop = useCallback(() => {
        hub.stop();
    }, [hub]);

    const handleConvert = useCallback(
        async (m) => {
            setConvertingId(m.fileId);
            try {
                await hub.convertPng(m);
            } finally {
                setConvertingId(null);
            }
        },
        [hub],
    );

    // ── two-step "clear history" confirm (misclick guard) ─────────────
    const handleClear = useCallback(() => {
        if (!confirmClear) {
            setConfirmClear(true);
            clearTimeout(confirmTimer.current);
            confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
            return;
        }
        clearTimeout(confirmTimer.current);
        setConfirmClear(false);
        hub.clearHistory();
    }, [confirmClear, hub]);

    useEffect(
        () => () => {
            clearTimeout(confirmTimer.current);
        },
        [],
    );

    // ── stable, memo-friendly callbacks (all take the media object) ───
    const onDownloadOriginal = useCallback((m) => hub.downloadOriginal(m), [hub]);
    const onCopyLink = useCallback((m) => hub.copyLink(m), [hub]);
    const onToggleSet = useCallback((m) => hub.toggleSet(m.fileId, m.setName), [hub]);
    const onSetRetry = useCallback((m) => hub.loadSet(m.fileId, m.setName), [hub]);
    const onDownloadOne = useCallback((st) => hub.downloadOne(st), [hub]);
    const onDownloadAll = useCallback((stickers) => hub.downloadAll(stickers), [hub]);
    const onZip = useCallback((m) => hub.packZip(m.fileId), [hub]);

    const onPick = useCallback(
        (m) => {
            hub.pickMedia(m);
            const id = `${m.fileId}:${m.timestamp}`;
            const el = listRef.current?.querySelector(`[data-media-id="${CSS.escape(id)}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        [hub],
    );

    const onExit = () => {
        if (host && typeof host.setView === 'function') host.setView('m3');
        else if (window.history.length > 1) window.history.back();
    };

    return (
        <div className="nb-app nb-theme" data-theme={theme}>
            <TopBar onExit={onExit} theme={theme} onThemeToggle={toggleTheme} isPolling={hub.isPolling} />

            <main className="nb-shell">
                {/* ── TOKEN CARD ─────────────────────────────────────── */}
                <Card variant="raised" className="nb-token" style={{ marginBottom: 20 }}>
                    <CardHeader
                        icon="key"
                        title="Bot 令牌"
                        sub="输入 Token 开始接收贴纸"
                        extra={<StatusBadge state={hub.isPolling ? hub.status.state : 'offline'} text={hub.status.text} />}
                    />
                    <div className="nb-token__body">
                        <TextField
                            id="nb-token-input"
                            mono
                            inputRef={tokenInputRef}
                            type={visible ? 'text' : 'password'}
                            value={hub.token}
                            onChange={(e) => hub.setToken(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !hub.isPolling) handleStart();
                            }}
                            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={hub.isPolling}
                            trailing={
                                <IconButton
                                    icon={visible ? 'eye-off' : 'eye'}
                                    label={visible ? '隐藏令牌' : '显示令牌'}
                                    size="sm"
                                    onClick={() => setVisible((v) => !v)}
                                />
                            }
                        />
                        <div className="nb-token__btns">
                            <Button icon="play" onClick={handleStart} disabled={hub.isPolling}>
                                监听
                            </Button>
                            <Button variant="danger" icon="stop" onClick={handleStop} disabled={!hub.isPolling}>
                                停止
                            </Button>
                        </div>
                    </div>
                    <div className="nb-token__status">
                        <span className="nb-token__dot" aria-hidden="true" />
                        <span className="nb-token__state">{hub.status.text}</span>
                        <span className="nb-token__spacer" />
                        <span className="nb-token__time">{hub.lastPoll ? `最后轮询 ${fmtTime(hub.lastPoll)}` : ''}</span>
                    </div>
                </Card>

                {/* ── MEDIA AREA ─────────────────────────────────────── */}
                <section className="nb-media-area" ref={listRef}>
                    {hub.mediaList.length === 0 ? (
                        <EmptyState
                            icon="image"
                            title="等待媒体内容"
                            desc="向你的 Bot 发送贴纸、GIF 或动画，它们将自动出现在这里。"
                        />
                    ) : (
                        hub.mediaList.map((m) => {
                            const id = `${m.fileId}:${m.timestamp}`;
                            return (
                                <MediaCard
                                    key={id}
                                    media={m}
                                    id={id}
                                    active={hub.activeId === id}
                                    converting={convertingId === m.fileId}
                                    set={hub.sets[m.fileId] || null}
                                    zipProgress={hub.zip.fileId === m.fileId ? hub.zip.progress : 0}
                                    zipPacking={hub.zip.fileId === m.fileId && hub.zip.packing}
                                    onDownloadOriginal={onDownloadOriginal}
                                    onConvertPng={handleConvert}
                                    onCopyLink={onCopyLink}
                                    onToggleSet={onToggleSet}
                                    onSetRetry={onSetRetry}
                                    onDownloadOne={onDownloadOne}
                                    onDownloadAll={onDownloadAll}
                                    onZip={onZip}
                                />
                            );
                        })
                    )}
                </section>

                {/* ── HISTORY ────────────────────────────────────────── */}
                <HistoryList items={hub.mediaList.slice(0, 12)} onPick={onPick} onClear={handleClear} confirming={confirmClear} />

                <footer className="nb-footer">
                    <span>STICKER HUB</span>
                    <span className="nb-footer__sep">/</span>
                    <span>NEO-BRUTALISM · REACT</span>
                    <span className="nb-footer__sep">/</span>
                    <span>MATERIAL 3 仍保留在底层</span>
                </footer>
            </main>

            <SnackbarStack toasts={toasts} onDone={dismissToast} />
        </div>
    );
}

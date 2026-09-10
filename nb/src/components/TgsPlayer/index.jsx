/**
 * TgsPlayer — Lottie renderer for .tgs animated stickers.
 * Port of the M3 TGSRenderer: fetch gzipped JSON → DecompressionStream
 * (gzip) → lottie.loadAnimation(svg). Falls back to a brutal spinner
 * placeholder when rendering is impossible.
 */
import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { Icon } from '../../icons';
import './styles.css';

async function decompressGzip(buffer) {
    if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(buffer);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks = [];
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const total = chunks.reduce((a, c) => a + c.length, 0);
        const out = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.length;
        }
        return out;
    }
    throw new Error('No decompression support');
}

export function TgsPlayer({ url, size = 140 }) {
    const boxRef = useRef(null);
    const animRef = useRef(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setFailed(false);
        (async () => {
            try {
                // Lazy-load lottie so its (canvas-dependent) initialization
                // only happens when a TGS sticker actually renders.
                const lottie = (await import('lottie-web')).default;
                const resp = await fetch(url);
                if (!resp.ok) throw new Error('fetch tgs failed');
                const compressed = await resp.arrayBuffer();
                const json = JSON.parse(new TextDecoder().decode(await decompressGzip(compressed)));
                if (cancelled || !boxRef.current) return;
                animRef.current = lottie.loadAnimation({
                    container: boxRef.current,
                    animationData: json,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                });
            } catch (e) {
                console.warn('TGS 渲染失败:', e.message);
                if (!cancelled) setFailed(true);
            }
        })();
        return () => {
            cancelled = true;
            if (animRef.current) {
                try {
                    animRef.current.destroy();
                } catch (_) {}
                animRef.current = null;
            }
        };
    }, [url]);

    if (failed) {
        return (
            <div className="nb-tgs-fallback">
                <span className="nb-spinner nb-spinner--lg" aria-hidden="true" />
                <span className="nb-tgs-fallback__label">Lottie · TGS</span>
            </div>
        );
    }
    return <div className="nb-tgs" ref={boxRef} style={{ width: size, height: size }} aria-label="TGS 动画贴纸" />;
}

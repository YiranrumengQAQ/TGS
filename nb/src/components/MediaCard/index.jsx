/**
 * MediaCard — one received sticker / GIF / animation / video / file.
 * Preview (checker surface) + info grid + action row + set expansion.
 *
 * Wrapped in React.memo: the poll loop ticks state (lastPoll) every ~20s,
 * and without memo the whole media list would re-render on each tick.
 * All callbacks are stable (useCallback in App) and take the media object
 * as an argument, so prop references stay stable between ticks.
 */
import React from 'react';
import { Icon } from '../../icons';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { SetPanel } from '../SetPanel';
import { TgsPlayer } from '../TgsPlayer';
import { DownloadManager } from '../../lib/downloadManager';
import { sourceLabel } from '../../lib/utils';
import './styles.css';

function Preview({ media }) {
    if (media.type === 'tgs') {
        return (
            <div className="nb-media__stage">
                <TgsPlayer url={media.originalUrl} size={150} />
            </div>
        );
    }
    if (media.type === 'webm' || media.type === 'mp4') {
        return (
            <div className="nb-media__stage">
                <video className="nb-media__video" src={media.originalUrl} controls preload="metadata" playsInline />
            </div>
        );
    }
    return (
        <div className="nb-media__stage">
            <img
                className="nb-media__img"
                src={media.originalUrl}
                alt="Sticker preview"
                loading="lazy"
                decoding="async"
            />
        </div>
    );
}

export const MediaCard = React.memo(function MediaCard({
    media,
    id,
    active = false,
    converting = false,
    set = null,
    zipProgress = 0,
    zipPacking = false,
    onDownloadOriginal,
    onConvertPng,
    onCopyLink,
    onToggleSet,
    onSetRetry,
    onDownloadOne,
    onDownloadAll,
    onZip,
}) {
    const items = [
        { label: '格式', value: media.type.toUpperCase() },
        { label: '尺寸', value: media.dimensions },
        { label: '大小', value: DownloadManager.formatFileSize(media.fileSize) },
        { label: '来源', value: sourceLabel(media.sourceCategory) },
    ];
    if (media.emoji) items.push({ label: '关联符号', value: media.emoji });
    if (media.setName) items.push({ label: '套装', value: media.setName });

    const isVideo = media.type === 'webm' || media.type === 'mp4';
    const setBusy = Boolean(set && set.status === 'loading');
    const setButtonLabel = !set ? '套装' : setBusy ? '加载中' : set.status === 'error' ? '重试' : '收起';
    const setButtonIcon = !set ? 'collections' : setBusy ? undefined : set.status === 'error' ? 'refresh' : 'close';

    return (
        <article className={`nb-media ${active ? 'nb-media--active' : ''}`} data-media-id={id} data-file-id={media.fileId}>
            <div className="nb-media__preview nb-checker">
                <span className={`nb-media__badge nb-badge ${media.type === 'tgs' ? 'nb-badge--animated' : isVideo ? 'nb-badge--video' : ''}`}>
                    {media.type.toUpperCase()}
                </span>
                <Preview media={media} />
            </div>

            <dl className="nb-media__info">
                {items.map((it) => (
                    <div className="nb-media__info-item" key={it.label}>
                        <dt>{it.label}</dt>
                        <dd title={it.value}>{it.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="nb-media__actions">
                <Button size="sm" icon="download" onClick={() => onDownloadOriginal(media)}>
                    原文件
                </Button>
                {media.type === 'webp' && (
                    <Button size="sm" variant="outline" icon="transform" loading={converting} onClick={() => onConvertPng(media)}>
                        PNG
                    </Button>
                )}
                <Button size="sm" variant="outline" icon="copy" onClick={() => onCopyLink(media)}>
                    链接
                </Button>
                {media.setName && (
                    <Button size="sm" variant="accent" icon={setButtonIcon} loading={setBusy} onClick={() => onToggleSet(media)}>
                        {setButtonLabel}
                    </Button>
                )}
            </div>

            {media.setName && (
                <SetPanel
                    state={set}
                    zipProgress={zipProgress}
                    zipPacking={zipPacking}
                    onRetry={() => onSetRetry(media)}
                    onDownloadOne={onDownloadOne}
                    onDownloadAll={() => onDownloadAll(set?.data?.stickers || [])}
                    onZip={() => onZip(media)}
                />
            )}
        </article>
    );
});

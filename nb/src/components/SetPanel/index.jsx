/**
 * SetPanel — sticker-set expansion under a MediaCard.
 * States: loading → grid | error → retry.
 * Grid tiles are click-to-download; batch row: 逐个下载全部 / 打包 ZIP (+progress).
 */
import React from 'react';
import { Icon } from '../../icons';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ProgressBar } from '../ProgressBar';
import './styles.css';

function Tile({ sticker, onDownloadOne }) {
    const isAnim = sticker.type === 'tgs' || sticker.type === 'webm' || sticker.type === 'mp4';
    return (
        <button type="button" className="nb-set__tile" onClick={() => onDownloadOne(sticker)} title={`下载 ${sticker.type.toUpperCase()}`}>
            {sticker.thumbUrl || sticker.url ? (
                <img src={sticker.thumbUrl || sticker.url} alt={sticker.emoji || sticker.type} loading="lazy" decoding="async" />
            ) : (
                <span className="nb-set__tile-empty">
                    <Icon name="image" size={22} />
                </span>
            )}
            {isAnim && (
                <span className="nb-badge nb-badge--tiny">{sticker.type === 'tgs' ? 'TGS' : 'VID'}</span>
            )}
            <span className="nb-set__tile-emoji">{sticker.emoji || ''}</span>
        </button>
    );
}

export function SetPanel({
    state,
    zipProgress = 0,
    zipPacking = false,
    onRetry,
    onDownloadOne,
    onDownloadAll,
    onZip,
}) {
    if (!state) return null;

    if (state.status === 'loading') {
        return (
            <div className="nb-set nb-set--loading">
                <span className="nb-spinner nb-spinner--lg" aria-hidden="true" />
                <span className="nb-set__loading-text">加载中…</span>
            </div>
        );
    }

    if (state.status === 'error') {
        return (
            <div className="nb-set nb-set--error">
                <Icon name="alert" size={18} />
                <span className="nb-set__error-text">加载失败: {state.error}</span>
                <Button size="xs" variant="outline" icon="refresh" onClick={onRetry}>
                    重试
                </Button>
            </div>
        );
    }

    const { data, name } = state;
    const showProgress = zipPacking || zipProgress > 0;

    return (
        <div className="nb-set">
            <div className="nb-set__head">
                <span className="nb-set__title">
                    {data.title || name} <Badge size="tiny" variant="yellow">{data.stickers.length}</Badge>
                </span>
                <span className="nb-set__hint">点击贴纸下载</span>
            </div>

            {showProgress && (
                <ProgressBar
                    value={zipProgress}
                    label={zipPacking ? '打包' : '完成'}
                    detail={zipPacking ? undefined : '✓'}
                />
            )}

            <div className="nb-set__grid">
                {data.stickers.map((s) => (
                    <Tile key={s.fileId} sticker={s} onDownloadOne={onDownloadOne} />
                ))}
            </div>

            <div className="nb-set__actions">
                <Button size="sm" variant="outline" icon="download" onClick={onDownloadAll}>
                    逐个下载全部
                </Button>
                <Button size="sm" variant="secondary" icon="zip" loading={zipPacking} onClick={onZip}>
                    {zipPacking ? '打包中' : '打包 ZIP'}
                </Button>
            </div>
        </div>
    );
}

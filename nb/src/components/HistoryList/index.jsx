/**
 * HistoryList — recent-received section (up to 12 shown, max 30 kept).
 */
import React from 'react';
import { Icon } from '../../icons';
import { Button } from '../Button';
import { DownloadManager } from '../../lib/downloadManager';
import './styles.css';

export function HistoryList({ items = [], onPick, onClear }) {
    if (!items.length) return null;
    return (
        <section className="nb-history">
            <div className="nb-history__head">
                <span className="nb-history__label">最近记录 · RECENT</span>
                <Button size="xs" variant="outline" icon="trash" onClick={onClear}>
                    清除全部
                </Button>
            </div>
            <div className="nb-history__list">
                {items.map((item) => (
                    <button
                        type="button"
                        key={`${item.fileId}:${item.timestamp}`}
                        className="nb-history__item"
                        onClick={() => onPick(item)}
                    >
                        <img
                            className="nb-history__thumb nb-checker"
                            src={item.thumbnail || item.originalUrl}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.src = item.originalUrl;
                            }}
                        />
                        <span className="nb-history__info">
                            <span className="nb-history__type">{item.type.toUpperCase()}</span>
                            <span className="nb-history__meta">
                                {DownloadManager.formatFileSize(item.fileSize)} · {item.dimensions}
                            </span>
                        </span>
                        <Icon name="arrow-right" size={16} className="nb-history__arrow" />
                    </button>
                ))}
            </div>
        </section>
    );
}

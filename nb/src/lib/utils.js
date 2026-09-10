/** Small shared helpers. */

export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/** File extension for a media type (tgs/webm/mp4/webp/…). */
export function extOf(type) {
    if (type === 'tgs') return 'tgs';
    if (type === 'webm') return 'webm';
    if (type === 'mp4') return 'mp4';
    return type || 'bin';
}

/** 2026-09-10 14:03:07 style local time, HH:MM:SS. */
export function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

/** zh-CN source category labels (parity with M3 UI). */
export function sourceLabel(category) {
    switch (category) {
        case 'sticker':
            return '贴纸';
        case 'animation':
            return 'GIF/动画';
        case 'document':
            return '文件';
        case 'video':
            return '视频';
        default:
            return '未知';
    }
}

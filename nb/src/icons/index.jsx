/**
 * Icons primitive — chunky 24×24 SVG set (stroke 2.4, square joins).
 * Neo-brutalist icons are thick, geometric and unapologetically crude.
 */
import React from 'react';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
const F = { fill: 'currentColor', stroke: 'none' };

const ICONS = {
    sticker: (
        <g {...S}>
            <path d="M4 4h11l5 5v11H4z" />
            <path d="M15 4v5h5" />
            <circle cx="9.5" cy="11" r="0.6" fill="currentColor" stroke="none" />
            <path d="M9 15c1 1 4 1 5 0" strokeWidth="2" />
        </g>
    ),
    key: (
        <g {...S}>
            <circle cx="8" cy="12" r="4" />
            <path d="M12 12h9M18 12v4M21 12v3" />
        </g>
    ),
    play: <path {...F} d="M7 4.5 19.5 12 7 19.5z" />,
    stop: <rect {...F} x="6" y="6" width="12" height="12" rx="1" />,
    eye: (
        <g {...S}>
            <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="3" />
        </g>
    ),
    'eye-off': (
        <g {...S}>
            <path d="M2.5 12S6 5.8 12 5.8c1.6 0 3 .4 4.3 1M21.5 12S18 18.2 12 18.2c-1.6 0-3-.4-4.3-1" />
            <path d="M4 4l16 16" />
        </g>
    ),
    download: (
        <g {...S}>
            <path d="M12 3v11M7 10l5 5 5-5M4 20h16" />
        </g>
    ),
    copy: (
        <g {...S}>
            <rect x="9" y="9" width="11" height="11" rx="1" />
            <path d="M5 14V4h10" />
        </g>
    ),
    collections: (
        <g {...S}>
            <path d="M12 3 3 8l9 5 9-5z" />
            <path d="M3 12l9 5 9-5" />
            <path d="M3 16l9 5 9-5" />
        </g>
    ),
    zip: (
        <g {...S}>
            <path d="M3 6h6l2 2h10v12H3z" />
            <path d="M10 10v2M13 12v2M10 14v2" strokeWidth="2" />
        </g>
    ),
    image: (
        <g {...S}>
            <rect x="3.5" y="5" width="17" height="14" rx="1" />
            <circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" />
            <path d="M5.5 16.5l4-4 3 3 3.5-3.5 2.5 2.5" />
        </g>
    ),
    transform: (
        <g {...S}>
            <path d="M7 4 3 8l4 4" />
            <path d="M3 8h13" />
            <path d="M17 20l4-4-4-4" />
            <path d="M21 16H8" />
        </g>
    ),
    sun: (
        <g {...S}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.5l1.8-1.8M17.3 6.7l1.8-1.8" />
        </g>
    ),
    moon: <path {...S} d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z" />,
    back: <path {...S} d="M15 5l-7 7 7 7" />,
    check: <path {...S} d="M4.5 12.5 10 18 19.5 7" />,
    alert: (
        <g {...S}>
            <path d="M12 3.5 22 20H2z" />
            <path d="M12 10v4.5M12 17.2v.01" />
        </g>
    ),
    trash: (
        <g {...S}>
            <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10 11v6M14 11v6" />
        </g>
    ),
    refresh: (
        <g {...S}>
            <path d="M20 12a8 8 0 1 1-2.4-5.7L20 8.5" />
            <path d="M20 3.5v5h-5" />
        </g>
    ),
    'arrow-right': <path {...S} d="M4 12h14M13 6l6 6-6 6" />,
    star: <path {...F} d="M12 2.5 14.6 9l6.9.3-5.4 4.3 1.8 6.7L12 16.8l-5.9 3.5 1.8-6.7L2.5 9.3 9.4 9z" />,
    close: <path {...S} d="M5.5 5.5l13 13M18.5 5.5l-13 13" />,
    video: (
        <g {...S}>
            <rect x="3.5" y="6.5" width="12" height="11" rx="1" />
            <path d="M15.5 10.5 20.5 8v8l-5-2.5" />
        </g>
    ),
};

export function Icon({ name, size = 20, strokeWidth, className = '', style, ...rest }) {
    const def = ICONS[name];
    if (!def) return null;
    return (
        <svg
            className={className ? `nb-icon ${className}` : 'nb-icon'}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            style={style}
            {...rest}
        >
            {def}
        </svg>
    );
}

export function hasIcon(name) {
    return Boolean(ICONS[name]);
}

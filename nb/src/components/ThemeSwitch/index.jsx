/**
 * ThemeSwitch — square-knob light/dark toggle.
 */
import React from 'react';
import { Icon } from '../../icons';
import './styles.css';

export function ThemeSwitch({ theme, onToggle }) {
    const isDark = theme === 'dark';
    return (
        <button
            type="button"
            className="nb-switch"
            data-theme={isDark ? 'dark' : 'light'}
            onClick={onToggle}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
            title={isDark ? '切换到亮色' : '切换到暗色'}
        >
            <span className="nb-switch__icon" aria-hidden="true">
                <Icon name="sun" size={14} />
            </span>
            <span className="nb-switch__icon" aria-hidden="true">
                <Icon name="moon" size={14} />
            </span>
            <span className="nb-switch__knob" aria-hidden="true" />
        </button>
    );
}

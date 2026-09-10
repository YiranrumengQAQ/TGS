/**
 * TopBar — sticky brutal header: logo block, title, NB sticker,
 * "back to M3" exit + theme switch.
 */
import React from 'react';
import { Icon } from '../../icons';
import { ThemeSwitch } from '../ThemeSwitch';
import './styles.css';

export function TopBar({ onExit, theme, onThemeToggle, isPolling }) {
    return (
        <header className="nb-topbar">
            <div className="nb-topbar__start">
                <div className="nb-topbar__logo" aria-hidden="true">
                    <Icon name="sticker" size={24} strokeWidth={2.2} />
                </div>
                <div className="nb-topbar__titles">
                    <div className="nb-topbar__title">
                        <span className="nb-topbar__title-text">Sticker Hub</span>
                        <span className="nb-topbar__stamp" aria-hidden="true">NB</span>
                    </div>
                    <div className="nb-topbar__sub">TELEGRAM · NEO-BRUTALISM</div>
                </div>
            </div>
            <div className="nb-topbar__actions">
                {isPolling && (
                    <span className="nb-topbar__live" aria-hidden="true">
                        <span className="nb-spinner" style={{ width: 12, height: 12, borderWidth: 2.5 }} />
                        LIVE
                    </span>
                )}
                <ThemeSwitch theme={theme} onToggle={onThemeToggle} />
                {onExit && (
                    <button type="button" className="nb-topbar__exit" onClick={onExit} title="切回 Material 3 界面">
                        <Icon name="back" size={15} />
                        <span>M3</span>
                    </button>
                )}
            </div>
        </header>
    );
}

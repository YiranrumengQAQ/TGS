/**
 * Snackbar — brutal toast stack (bottom-center).
 * Parent owns the queue: [{ id, msg, variant }].
 */
import React, { useEffect } from 'react';
import { Icon } from '../../icons';
import './styles.css';

const ICONS = { default: 'check', error: 'alert', success: 'check' };
const LIFE_MS = 2600;

function Toast({ toast, onDone }) {
    useEffect(() => {
        const t = setTimeout(() => onDone(toast.id), LIFE_MS);
        return () => clearTimeout(t);
    }, [toast.id, onDone]);
    return (
        <div className={`nb-toast nb-toast--${toast.variant || 'default'}`}>
            <Icon name={ICONS[toast.variant || 'default']} size={15} />
            <span className="nb-toast__msg">{toast.msg}</span>
        </div>
    );
}

export function SnackbarStack({ toasts = [], onDone }) {
    if (!toasts.length) return null;
    return (
        <div className="nb-toast-stack" aria-live="polite">
            {toasts.map((t) => (
                <Toast key={t.id} toast={t} onDone={onDone} />
            ))}
        </div>
    );
}

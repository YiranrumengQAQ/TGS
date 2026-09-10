/**
 * TextField — bordered input with optional trailing control.
 * `mono` uses the monospace face (bot tokens, ids).
 */
import React from 'react';
import './styles.css';

export function TextField({
    label,
    hint,
    trailing,
    mono = false,
    className = '',
    inputClassName = '',
    ...inputProps
}) {
    const id = inputProps.id;
    return (
        <div className={['nb-field', mono && 'nb-field--mono', className].filter(Boolean).join(' ')}>
            {label && (
                <label className="nb-field__label" htmlFor={id}>
                    {label}
                </label>
            )}
            <div className="nb-field__box">
                <input className={['nb-field__input', inputClassName].filter(Boolean).join(' ')} {...inputProps} />
                {trailing && <div className="nb-field__trailing">{trailing}</div>}
            </div>
            {hint && <div className="nb-field__hint">{hint}</div>}
        </div>
    );
}

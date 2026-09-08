import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${className}`.trim()}
            style={{
              paddingLeft: leftIcon ? '38px' : undefined,
              paddingRight: rightIcon ? '38px' : undefined,
              borderColor: error ? 'var(--color-danger-400)' : undefined,
            }}
            aria-invalid={!!error}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span id={inputId ? `${inputId}-error` : undefined} className="form-error" role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

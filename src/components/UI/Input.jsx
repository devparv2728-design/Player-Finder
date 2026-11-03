/**
 * Input — form field wrapper with label, optional icon, error message.
 *
 * Supports text, email, password (with visibility toggle), number, and textarea.
 * Designed to work with react-hook-form's `register()` via spread props.
 *
 * @param {string} [label]
 * @param {string} [error]         - Validation error text.
 * @param {React.ReactNode} [icon] - Left icon element (e.g. from lucide-react).
 * @param {'text'|'email'|'password'|'number'|'textarea'} [type='text']
 */
import { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

export default function Input({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);

  const isTextarea = type === 'textarea';
  const inputType = type === 'password' && showPassword ? 'text' : type;

  const sharedProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: `${isTextarea ? styles.textarea : styles.input} ${icon ? styles.hasIcon : ''}`,
    ...rest,
  };

  return (
    <div className={`${styles.wrapper} ${error ? styles.error : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.inputWrap}>
        {icon && <span className={styles.icon}>{icon}</span>}

        {isTextarea ? (
          <textarea {...sharedProps} />
        ) : (
          <input type={inputType} {...sharedProps} />
        )}

        {type === 'password' && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <span id={errorId} className={styles.errorMsg} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * Select — styled dropdown with label and error.
 *
 * @param {string} [label]
 * @param {{ value: string, label: string }[]} options
 * @param {string} [error]
 * @param {string} [placeholder] - Placeholder option text.
 */
import { useId } from 'react';
import styles from './Select.module.css';

export default function Select({
  label,
  options = [],
  error,
  placeholder,
  className = '',
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={`${styles.wrapper} ${error ? styles.error : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      <select
        id={id}
        className={styles.select}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <span id={errorId} className={styles.errorMsg} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

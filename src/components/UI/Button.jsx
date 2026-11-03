/**
 * Button — primary action element.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'} [variant='primary']
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {boolean} [disabled]
 * @param {boolean} [loading]   - Shows a spinner and disables interaction.
 * @param {boolean} [fullWidth] - Stretch to fill container width.
 * @param {React.ReactNode} children
 */
import Spinner from './Spinner';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;

  const cls = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={cls}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
      {loading && (
        <span className={styles.spinnerWrap}>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
    </button>
  );
}

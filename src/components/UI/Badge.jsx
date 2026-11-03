/**
 * Badge — pill-shaped status / category label.
 *
 * @param {'default'|'success'|'warning'|'danger'|'info'|'neutral'} [variant='default']
 * @param {'sm'|'md'} [size='sm']
 * @param {React.ReactNode} children
 * @param {string} [className]
 */
import styles from './Badge.module.css';

export default function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  ...rest
}) {
  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

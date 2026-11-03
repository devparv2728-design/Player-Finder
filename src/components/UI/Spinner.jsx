/**
 * Spinner — CSS-only loading indicator.
 *
 * @param {'sm'|'md'|'lg'} [size='md'] - Visual size of the spinner.
 * @param {string} [className] - Additional CSS class names.
 */
import styles from './Spinner.module.css';

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

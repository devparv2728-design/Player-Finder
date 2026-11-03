/**
 * Skeleton — shimmer loading placeholder.
 *
 * @param {string|number} [width]    - CSS width value.
 * @param {string|number} [height]   - CSS height value.
 * @param {'text'|'circle'|'rect'} [variant='text'] - Shape variant.
 * @param {string} [className]       - Extra CSS classes.
 */
import styles from './Skeleton.module.css';

export default function Skeleton({
  width,
  height,
  variant = 'text',
  className = '',
}) {
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // For circle, if only one dimension given, mirror it
  if (variant === 'circle') {
    if (width && !height) style.height = style.width;
    if (height && !width) style.width = style.height;
  }

  return (
    <span
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

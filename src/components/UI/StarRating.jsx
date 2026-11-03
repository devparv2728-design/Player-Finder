/**
 * StarRating — display or interactive star rating (1-5).
 *
 * @param {number} value           - Current rating value (1-5).
 * @param {(v: number) => void} [onChange] - If provided, stars become clickable (interactive mode).
 * @param {number} [count]         - Total number of ratings to display beside stars.
 * @param {number} [size=20]       - Icon size in pixels.
 * @param {string} [className]
 */
import { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

export default function StarRating({
  value = 0,
  onChange,
  count,
  size = 20,
  className = '',
}) {
  const isInteractive = typeof onChange === 'function';
  const [hovered, setHovered] = useState(0);

  const displayValue = isInteractive && hovered ? hovered : value;

  return (
    <span className={`${styles.wrapper} ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      <span className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;

          if (!isInteractive) {
            return (
              <span
                key={star}
                className={`${styles.starBtn} ${styles.readOnly} ${isFilled ? styles.filled : ''}`}
              >
                <Star
                  size={size}
                  fill={isFilled ? 'currentColor' : 'none'}
                  strokeWidth={isFilled ? 0 : 1.5}
                />
              </span>
            );
          }

          return (
            <button
              key={star}
              type="button"
              className={`${styles.starBtn} ${isFilled ? styles.filled : ''}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                fill={isFilled ? 'currentColor' : 'none'}
                strokeWidth={isFilled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </span>

      {typeof count === 'number' && (
        <span className={styles.count}>({count})</span>
      )}
    </span>
  );
}

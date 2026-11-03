/**
 * Avatar — circular user avatar with image or initials fallback.
 *
 * @param {string} [src]   - Image URL.
 * @param {string} name    - Full name, used for alt text and initials fallback.
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string} [className]
 */
import { useState } from 'react';
import styles from './Avatar.module.css';

/** Deterministic background color from a name string. */
function nameToColor(name) {
  const hues = [210, 160, 330, 45, 275, 0, 120, 195, 30, 300];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue} 50% 35%)`;
}

/** Extract first letter of first & last name. */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;

  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={showImage ? undefined : { backgroundColor: nameToColor(name) }}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt={name}
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

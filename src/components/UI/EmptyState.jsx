import Button from './Button'
import styles from './EmptyState.module.css'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className={styles.empty}>
      {Icon && (
        <div className={styles.iconWrap} aria-hidden="true">
          <Icon size={28} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {action && (
        <div className={styles.action}>
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}


import styles from './Tabs.module.css'

export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="View sections">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`${styles.badge} ${isActive ? styles.badgeActive : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}


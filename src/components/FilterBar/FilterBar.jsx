import { RotateCcw } from 'lucide-react'
import Button from '../UI/Button'
import styles from './FilterBar.module.css'

export default function FilterBar({ filters, onFilterChange, sports = [] }) {
  const hasActiveFilters =
    Boolean(filters.sportId) || Boolean(filters.date) || Boolean(filters.skillLevel)

  const handleReset = () => {
    onFilterChange({ sportId: '', date: '', skillLevel: '' })
  }

  return (
    <div className={styles.bar} role="region" aria-label="Match filters">
      <div className={styles.fieldGroup}>
        <label htmlFor="filter-sport" className={styles.label}>
          Sport
        </label>
        <select
          id="filter-sport"
          className={styles.select}
          value={filters.sportId || ''}
          onChange={(e) => onFilterChange({ ...filters, sportId: e.target.value })}
        >
          <option value="">All Sports</option>
          {sports.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="filter-skill" className={styles.label}>
          Skill Level
        </label>
        <select
          id="filter-skill"
          className={styles.select}
          value={filters.skillLevel || ''}
          onChange={(e) => onFilterChange({ ...filters, skillLevel: e.target.value })}
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="any">Any Level</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="filter-date" className={styles.label}>
          Date
        </label>
        <input
          id="filter-date"
          type="date"
          className={styles.dateInput}
          value={filters.date || ''}
          onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
        />
      </div>

      {hasActiveFilters && (
        <div className={styles.resetWrap}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            aria-label="Clear all filters"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}


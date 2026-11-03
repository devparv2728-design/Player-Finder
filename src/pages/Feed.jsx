import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PlusCircle, RefreshCw, Trophy } from 'lucide-react'
import { useOpenMatches } from '../hooks/useMatches'
import { useSports } from '../hooks/useSports'
import FilterBar from '../components/FilterBar/FilterBar'
import MatchCard from '../components/MatchCard/MatchCard'
import Button from '../components/UI/Button'
import Skeleton from '../components/UI/Skeleton'
import EmptyState from '../components/UI/EmptyState'
import styles from './Feed.module.css'

export default function Feed() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    sportId: '',
    skillLevel: '',
    date: '',
  })
  const [limit, setLimit] = useState(12)

  const { data: sports = [] } = useSports()
  const {
    data: matches = [],
    isLoading,
    isFetching,
    refetch,
  } = useOpenMatches(filters, limit)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Open Campus Matches</h1>
          <p className={styles.subtitle}>
            Find opponents and teammates playing soon on campus
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            aria-label="Refresh open matches"
          >
            <RefreshCw
              size={15}
              className={isFetching ? styles.spinning : ''}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/host')}
          >
            <PlusCircle size={16} aria-hidden="true" />
            Host a Match
          </Button>
        </div>
      </header>

      <FilterBar
        filters={filters}
        onFilterChange={(next) => {
          setFilters(next)
          setLimit(12)
        }}
        sports={sports}
      />

      {isLoading ? (
        <div className={styles.grid} aria-busy="true" aria-label="Loading matches">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className={styles.skeletonCard}>
              <Skeleton width="50%" height={20} />
              <Skeleton width="80%" height={16} />
              <Skeleton width="70%" height={16} />
              <Skeleton width="100%" height={36} />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No open matches found"
          description="No open games match your current filters. Try clearing filters or host a match in under a minute!"
          action={{
            label: 'Host a Match',
            onClick: () => navigate('/host'),
          }}
        />
      ) : (
        <>
          <div className={styles.grid}>
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {matches.length >= limit && (
            <div className={styles.loadMoreWrap}>
              <Button
                variant="secondary"
                onClick={() => setLimit((prev) => prev + 12)}
              >
                Load More Matches
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Calendar, PlusCircle, Clock, CheckCircle2 } from 'lucide-react'
import { useMyMatches } from '../hooks/useMatches'
import Tabs from '../components/UI/Tabs'
import MatchCard from '../components/MatchCard/MatchCard'
import EmptyState from '../components/UI/EmptyState'
import Skeleton from '../components/UI/Skeleton'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import styles from './MyMatches.module.css'

export default function MyMatches() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('hosting')
  const { data, isLoading } = useMyMatches()

  const hosting = data?.hosting || []
  const joined = data?.joined || []
  const pending = data?.pending || []

  const totalPendingRequestsOnMyHosted = hosting.reduce(
    (sum, m) => sum + (m.pending_count || 0),
    0
  )

  const tabs = [
    { id: 'hosting', label: 'Hosting', count: hosting.length },
    { id: 'joined', label: 'Joined', count: joined.length },
    { id: 'pending', label: 'Pending Requests', count: pending.length },
  ]

  const currentList =
    activeTab === 'hosting'
      ? hosting
      : activeTab === 'joined'
      ? joined
      : pending

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Matches</h1>
          <p className={styles.subtitle}>
            Manage games you host, matches you&apos;ve joined, and pending requests
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => navigate('/host')}>
          <PlusCircle size={16} /> Host a Match
        </Button>
      </header>

      {totalPendingRequestsOnMyHosted > 0 && (
        <div className={styles.alertBanner}>
          <span>
            🔔 You have <strong>{totalPendingRequestsOnMyHosted}</strong> pending join
            request{totalPendingRequestsOnMyHosted > 1 ? 's' : ''} waiting for your
            approval on matches you host.
          </span>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="80%" height={16} />
              <Skeleton width="100%" height={36} />
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={activeTab === 'hosting' ? Calendar : activeTab === 'joined' ? CheckCircle2 : Clock}
          title={
            activeTab === 'hosting'
              ? 'You haven’t hosted any matches yet'
              : activeTab === 'joined'
              ? 'You haven’t joined any matches yet'
              : 'No pending join requests'
          }
          description={
            activeTab === 'hosting'
              ? 'Host a match in under a minute and let campus players join you!'
              : 'Browse the open feed to find a game happening on campus.'
          }
          action={{
            label: activeTab === 'hosting' ? 'Host a Match' : 'Browse Open Feed',
            onClick: () => navigate(activeTab === 'hosting' ? '/host' : '/feed'),
          }}
        />
      ) : (
        <div className={styles.grid}>
          {currentList.map((match) => (
            <div key={match.id} className={styles.cardWrap}>
              {activeTab === 'hosting' && match.pending_count > 0 && (
                <div className={styles.pendingOverlayBadge}>
                  <Badge variant="warning" size="sm">
                    {match.pending_count} request{match.pending_count > 1 ? 's' : ''} pending
                  </Badge>
                </div>
              )}
              <MatchCard match={match} showStatus />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


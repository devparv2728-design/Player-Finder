import { Link } from 'react-router'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Users, ShieldCheck, Zap, Trophy, Star } from 'lucide-react'
import Badge from '../UI/Badge'
import Avatar from '../UI/Avatar'
import styles from './MatchCard.module.css'

const SKILL_BADGE_MAP = {
  beginner: { label: 'Beginner', variant: 'success' },
  intermediate: { label: 'Intermediate', variant: 'warning' },
  advanced: { label: 'Advanced', variant: 'danger' },
  any: { label: 'All Levels', variant: 'info' },
}

const STATUS_BADGE_MAP = {
  open: { label: 'Open', variant: 'success' },
  full: { label: 'Full', variant: 'warning' },
  completed: { label: 'Completed', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

export function getSportEmoji(sportName = '') {
  const n = sportName.toLowerCase()
  if (n.includes('badminton')) return '🏸'
  if (n.includes('table')) return '🏓'
  if (n.includes('cricket')) return '🏏'
  if (n.includes('football')) return '⚽'
  if (n.includes('basketball')) return '🏀'
  if (n.includes('volleyball')) return '🏐'
  if (n.includes('chess')) return '♟️'
  if (n.includes('tennis')) return '🎾'
  return '🏆'
}

export default function MatchCard({ match, showStatus = false }) {
  const sportName = match.sport?.name || 'Sport'
  const hostName = match.host?.full_name || 'Campus Player'
  const hostRating = Number(match.host?.avg_rating || 0)
  const hostRatingCount = Number(match.host?.rating_count || 0)
  const acceptedCount = match.accepted_count ?? 1
  const totalNeeded = match.players_needed || 2
  const spotsLeft = Math.max(0, totalNeeded - acceptedCount)

  const skillInfo = SKILL_BADGE_MAP[match.skill_level] || SKILL_BADGE_MAP.any
  const statusInfo = STATUS_BADGE_MAP[match.status] || STATUS_BADGE_MAP.open

  const matchDate = new Date(match.match_at)
  const formattedDate = format(matchDate, 'EEE, dd MMM')
  const formattedTime = format(matchDate, 'hh:mm a')

  return (
    <Link
      to={`/match/${match.id}`}
      className={styles.card}
      aria-label={`${sportName} match at ${match.venue} on ${formattedDate} at ${formattedTime}`}
    >
      <div className={styles.topRow}>
        <div className={styles.sportTag}>
          <span className={styles.emoji} aria-hidden="true">
            {getSportEmoji(sportName)}
          </span>
          <span className={styles.sportName}>{sportName}</span>
        </div>

        <div className={styles.badges}>
          {showStatus && (
            <Badge variant={statusInfo.variant} size="sm">
              {statusInfo.label}
            </Badge>
          )}
          <Badge variant={skillInfo.variant} size="sm">
            {skillInfo.label}
          </Badge>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <Calendar size={15} className={styles.metaIcon} aria-hidden="true" />
          <span>{formattedDate}</span>
        </div>
        <div className={styles.metaItem}>
          <Clock size={15} className={styles.metaIcon} aria-hidden="true" />
          <span>{formattedTime} IST</span>
        </div>
        <div className={`${styles.metaItem} ${styles.venueItem}`}>
          <MapPin size={15} className={styles.metaIcon} aria-hidden="true" />
          <span className="truncate">{match.venue}</span>
        </div>
      </div>

      {match.notes && <p className={styles.notes}>{match.notes}</p>}

      <div className={styles.divider} />

      <div className={styles.footerRow}>
        <div className={styles.hostInfo}>
          <Avatar src={match.host?.avatar_url} name={hostName} size="sm" />
          <div className={styles.hostText}>
            <span className={styles.hostName}>{hostName}</span>
            <span className={styles.hostRating}>
              <Star size={12} fill="currentColor" className={styles.starIcon} />
              {hostRating > 0 ? `${hostRating.toFixed(1)} (${hostRatingCount})` : 'New host'}
            </span>
          </div>
        </div>

        <div className={styles.rightStats}>
          <span
            className={`${styles.spotsPill} ${spotsLeft === 0 ? styles.spotsFull : ''}`}
          >
            <Users size={13} aria-hidden="true" />
            {spotsLeft === 0
              ? 'Full'
              : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left`}
          </span>

          <span className={styles.modeTag} title={match.join_mode === 'instant' ? 'Instant Join' : 'Host Approval'}>
            {match.join_mode === 'instant' ? (
              <>
                <Zap size={12} /> Instant
              </>
            ) : (
              <>
                <ShieldCheck size={12} /> Approval
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}


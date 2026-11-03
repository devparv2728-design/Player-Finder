import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  ShieldCheck,
  Phone,
  CheckCircle2,
  XCircle,
  Star,
  UserCheck,
  Edit3,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import {
  useMatch,
  useJoinMatch,
  useManageParticipant,
  useUpdateMatchStatus,
} from '../hooks/useMatches'
import { useMatchRatings } from '../hooks/useRatings'
import { supabase, isDemoMode } from '../lib/supabase'
import { getSportEmoji } from '../components/MatchCard/MatchCard'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import Avatar from '../components/UI/Avatar'
import Modal from '../components/UI/Modal'
import Input from '../components/UI/Input'
import RatePlayersModal from '../components/RatePlayersModal/RatePlayersModal'
import styles from './MatchDetail.module.css'

const SKILL_BADGE = {
  beginner: { label: 'Beginner', variant: 'success' },
  intermediate: { label: 'Intermediate', variant: 'warning' },
  advanced: { label: 'Advanced', variant: 'danger' },
  any: { label: 'All Levels', variant: 'info' },
}

const STATUS_BADGE = {
  open: { label: 'Open', variant: 'success' },
  full: { label: 'Full', variant: 'warning' },
  completed: { label: 'Completed', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: match, isLoading, error, refetch } = useMatch(id)
  const { data: matchRatings = [] } = useMatchRatings(id)

  const joinMatch = useJoinMatch()
  const manageParticipant = useManageParticipant()
  const updateMatchStatus = useUpdateMatchStatus()

  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ venue: '', notes: '' })

  // Realtime subscription for live updates on this match
  useEffect(() => {
    if (!id || isDemoMode) return

    const channel = supabase
      .channel(`match-detail-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_participants',
          filter: `match_id=eq.${id}`,
        },
        () => refetch()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, refetch])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingText}>Loading match details…</p>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className={styles.page}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
          <ArrowLeft size={16} /> Back to Feed
        </Button>
        <div className={styles.errorCard}>
          <h2>Match not found</h2>
          <p>This match may have been removed or the link is invalid.</p>
        </div>
      </div>
    )
  }

  const isHost = user?.id === match.host_id
  const myParticipation = (match.participants || []).find(
    (p) => p.user_id === user?.id
  )
  const myStatus = isHost ? 'accepted' : myParticipation?.status || null

  const acceptedParticipants = (match.participants || []).filter(
    (p) => p.status === 'accepted'
  )
  const pendingRequests = (match.participants || []).filter(
    (p) => p.status === 'pending'
  )

  const acceptedCount = acceptedParticipants.length
  const totalNeeded = match.players_needed || 2
  const spotsLeft = Math.max(0, totalNeeded - acceptedCount)
  const fillPercent = Math.min(100, Math.round((acceptedCount / totalNeeded) * 100))

  const sportName = match.sport?.name || 'Sport'
  const skillInfo = SKILL_BADGE[match.skill_level] || SKILL_BADGE.any
  const statusInfo = STATUS_BADGE[match.status] || STATUS_BADGE.open

  const matchDate = new Date(match.match_at)
  const isPast = matchDate <= new Date()
  const canSeeContacts = isHost || myStatus === 'accepted'

  const handleJoin = async () => {
    try {
      const resultStatus = await joinMatch.mutateAsync(match.id)
      if (resultStatus === 'accepted') {
        toast.success('You joined the match! Contact details are now unlocked.')
      } else {
        toast.success('Join request sent to the host!')
      }
    } catch (err) {
      toast.error(err?.message || 'Could not join match')
    }
  }

  const handleParticipantDecision = async (participantUserId, action) => {
    try {
      await manageParticipant.mutateAsync({
        matchId: match.id,
        participantUserId,
        action,
      })
      toast.success(
        action === 'accept'
          ? 'Player accepted into match!'
          : action === 'reject'
          ? 'Request declined.'
          : 'You left the match.'
      )
    } catch (err) {
      toast.error(err?.message || 'Action failed')
    }
  }

  const handleStatusChange = async (action) => {
    try {
      await updateMatchStatus.mutateAsync({ matchId: match.id, action })
      toast.success(
        action === 'complete'
          ? 'Match marked as completed! You can now rate players.'
          : 'Match cancelled.'
      )
    } catch (err) {
      toast.error(err?.message || 'Could not update match')
    }
  }

  const openEditModal = () => {
    setEditForm({ venue: match.venue || '', notes: match.notes || '' })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.venue.trim()) {
      toast.error('Venue is required')
      return
    }
    try {
      await updateMatchStatus.mutateAsync({
        matchId: match.id,
        action: 'edit',
        updates: {
          venue: editForm.venue.trim(),
          notes: editForm.notes.trim(),
        },
      })
      toast.success('Match details updated!')
      setEditModalOpen(false)
    } catch (err) {
      toast.error(err?.message || 'Failed to update match')
    }
  }

  const rateableProfiles = acceptedParticipants
    .map((p) => p.profile)
    .filter(Boolean)

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.headerRow}>
          <div className={styles.sportTitleGroup}>
            <span className={styles.sportEmoji} aria-hidden="true">
              {getSportEmoji(sportName)}
            </span>
            <div>
              <h1 className={styles.title}>{sportName} Match</h1>
              <span className={styles.hostedBy}>
                Hosted by{' '}
                <Link to={`/profile/${match.host_id}`} className={styles.hostLink}>
                  {match.host?.full_name || 'Campus Student'}
                </Link>
              </span>
            </div>
          </div>

          <div className={styles.badgeGroup}>
            <Badge variant={statusInfo.variant} size="md">
              {statusInfo.label}
            </Badge>
            <Badge variant={skillInfo.variant} size="md">
              {skillInfo.label}
            </Badge>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailBox}>
            <Calendar size={18} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Date</span>
              <strong className={styles.detailValue}>
                {format(matchDate, 'EEEE, dd MMM yyyy')}
              </strong>
            </div>
          </div>

          <div className={styles.detailBox}>
            <Clock size={18} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Time (IST)</span>
              <strong className={styles.detailValue}>
                {format(matchDate, 'hh:mm a')}
              </strong>
            </div>
          </div>

          <div className={styles.detailBox}>
            <MapPin size={18} className={styles.detailIcon} />
            <div>
              <span className={styles.detailLabel}>Venue</span>
              <strong className={styles.detailValue}>{match.venue}</strong>
            </div>
          </div>

          <div className={styles.detailBox}>
            {match.join_mode === 'instant' ? (
              <Zap size={18} className={styles.detailIcon} />
            ) : (
              <ShieldCheck size={18} className={styles.detailIcon} />
            )}
            <div>
              <span className={styles.detailLabel}>Join Mode</span>
              <strong className={styles.detailValue}>
                {match.join_mode === 'instant'
                  ? 'Instant Join'
                  : 'Host Approval Required'}
              </strong>
            </div>
          </div>
        </div>

        {match.notes && (
          <div className={styles.notesBox}>
            <span className={styles.notesLabel}>Host Notes</span>
            <p className={styles.notesText}>{match.notes}</p>
          </div>
        )}

        <div className={styles.spotsBox}>
          <div className={styles.spotsHeader}>
            <span className={styles.spotsTitle}>
              <Users size={16} /> Roster ({acceptedCount} / {totalNeeded} players)
            </span>
            <span className={styles.spotsCount}>
              {spotsLeft === 0
                ? 'All spots filled'
                : `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} remaining`}
            </span>
          </div>
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={fillPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={styles.progressFill}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* ---- Action Bar ---- */}
        <div className={styles.actionBar}>
          {isHost ? (
            <div className={styles.hostActions}>
              {(match.status === 'open' || match.status === 'full') && (
                <>
                  <Button variant="secondary" size="sm" onClick={openEditModal}>
                    <Edit3 size={15} /> Edit Details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={updateMatchStatus.isPending}
                    onClick={() => handleStatusChange('complete')}
                  >
                    <CheckCircle2 size={15} /> Mark Completed
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={updateMatchStatus.isPending}
                    onClick={() => handleStatusChange('cancel')}
                  >
                    <XCircle size={15} /> Cancel Match
                  </Button>
                </>
              )}
              {match.status === 'completed' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setRateModalOpen(true)}
                >
                  <Star size={16} /> Rate Players
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.playerActions}>
              {match.status === 'completed' && myStatus === 'accepted' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setRateModalOpen(true)}
                >
                  <Star size={16} /> Rate Players
                </Button>
              )}

              {match.status === 'cancelled' && (
                <span className={styles.statusNotice}>
                  This match was cancelled by the host.
                </span>
              )}

              {(match.status === 'open' || match.status === 'full') && (
                <>
                  {myStatus === 'accepted' ? (
                    <div className={styles.joinedBanner}>
                      <span className={styles.inBadge}>
                        <UserCheck size={16} /> You&apos;re in this match!
                      </span>
                      {!isPast && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={manageParticipant.isPending}
                          onClick={() =>
                            handleParticipantDecision(user.id, 'leave')
                          }
                        >
                          Leave Match
                        </Button>
                      )}
                    </div>
                  ) : myStatus === 'pending' ? (
                    <div className={styles.joinedBanner}>
                      <span className={styles.pendingBadge}>
                        ⏳ Join Request Pending Host Approval
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={manageParticipant.isPending}
                        onClick={() =>
                          handleParticipantDecision(user.id, 'leave')
                        }
                      >
                        Withdraw Request
                      </Button>
                    </div>
                  ) : match.status === 'full' || spotsLeft === 0 ? (
                    <Button variant="secondary" disabled>
                      Match is Full
                    </Button>
                  ) : isPast ? (
                    <Button variant="secondary" disabled>
                      Match Time Passed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      loading={joinMatch.isPending}
                      onClick={handleJoin}
                    >
                      {match.join_mode === 'instant'
                        ? '⚡ Join Match Instantly'
                        : '🛡️ Request to Join Match'}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---- Pending Requests (Visible to Host) ---- */}
      {isHost && pendingRequests.length > 0 && (
        <section className={styles.sectionCard} aria-label="Pending join requests">
          <h2 className={styles.sectionTitle}>
            Pending Join Requests ({pendingRequests.length})
          </h2>
          <div className={styles.participantList}>
            {pendingRequests.map((req) => {
              const p = req.profile
              return (
                <div key={req.id} className={styles.participantItem}>
                  <Link
                    to={`/profile/${req.user_id}`}
                    className={styles.participantIdentity}
                  >
                    <Avatar src={p?.avatar_url} name={p?.full_name || 'Student'} />
                    <div>
                      <div className={styles.participantName}>
                        {p?.full_name || 'Student'}
                      </div>
                      <div className={styles.participantSub}>
                        {p?.department || 'Campus'} •{' '}
                        {p?.avg_rating > 0
                          ? `★ ${Number(p.avg_rating).toFixed(1)} (${p.rating_count})`
                          : 'No ratings yet'}
                      </div>
                    </div>
                  </Link>

                  <div className={styles.requestBtns}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={spotsLeft === 0}
                      loading={manageParticipant.isPending}
                      onClick={() =>
                        handleParticipantDecision(req.user_id, 'accept')
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={manageParticipant.isPending}
                      onClick={() =>
                        handleParticipantDecision(req.user_id, 'reject')
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ---- Confirmed Players Roster ---- */}
      <section className={styles.sectionCard} aria-label="Confirmed players">
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>
            Confirmed Players ({acceptedParticipants.length})
          </h2>
          {!canSeeContacts && (
            <span className={styles.privacyNote}>
              🔒 Contact numbers unlock once you are accepted in this match
            </span>
          )}
        </div>

        <div className={styles.participantList}>
          {acceptedParticipants.map((part) => {
            const p = part.profile
            const isMatchHost = part.user_id === match.host_id
            return (
              <div key={part.id} className={styles.participantItem}>
                <Link
                  to={`/profile/${part.user_id}`}
                  className={styles.participantIdentity}
                >
                  <Avatar src={p?.avatar_url} name={p?.full_name || 'Player'} />
                  <div>
                    <div className={styles.participantName}>
                      {p?.full_name || 'Player'}{' '}
                      {isMatchHost && (
                        <Badge variant="info" size="sm">
                          Host
                        </Badge>
                      )}
                    </div>
                    <div className={styles.participantSub}>
                      {p?.department || 'Student'}
                      {p?.year ? ` • Year ${p.year}` : ''} •{' '}
                      {p?.avg_rating > 0
                        ? `★ ${Number(p.avg_rating).toFixed(1)} (${p.rating_count})`
                        : 'New player'}
                    </div>
                  </div>
                </Link>

                {canSeeContacts && p?.contact && (
                  <div className={styles.contactPill}>
                    <Phone size={13} />
                    <span>{p.contact}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- Edit Match Modal ---- */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Match Details"
      >
        <form onSubmit={handleSaveEdit} className={styles.editForm}>
          <Input
            label="Campus Venue"
            value={editForm.venue}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, venue: e.target.value }))
            }
          />
          <Input
            label="Notes"
            type="textarea"
            rows={3}
            value={editForm.notes}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateMatchStatus.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ---- Rate Players Modal ---- */}
      <RatePlayersModal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        matchId={match.id}
        participants={rateableProfiles}
        existingRatings={matchRatings}
        currentUserId={user?.id}
      />
    </div>
  )
}


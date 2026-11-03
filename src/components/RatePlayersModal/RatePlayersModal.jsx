import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import Avatar from '../UI/Avatar'
import StarRating from '../UI/StarRating'
import { useSubmitRating } from '../../hooks/useRatings'
import styles from './RatePlayersModal.module.css'

export default function RatePlayersModal({
  isOpen,
  onClose,
  matchId,
  participants = [],
  existingRatings = [],
  currentUserId,
}) {
  const submitRating = useSubmitRating()

  // Filter out current user
  const rateablePlayers = participants.filter((p) => p.id !== currentUserId)

  // State keyed by rateeId: { stars, comment, noShow, submitted }
  const [drafts, setDrafts] = useState({})
  const [submittingId, setSubmittingId] = useState(null)

  const getDraft = (playerId) => {
    return (
      drafts[playerId] || {
        stars: 5,
        comment: '',
        noShow: false,
      }
    )
  }

  const updateDraft = (playerId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [playerId]: {
        ...getDraft(playerId),
        ...patch,
      },
    }))
  }

  const isAlreadyRated = (playerId) => {
    return existingRatings.some(
      (r) => r.rater_id === currentUserId && r.ratee_id === playerId
    )
  }

  const handleRate = async (player) => {
    const draft = getDraft(player.id)
    if (!draft.stars || draft.stars < 1 || draft.stars > 5) {
      toast.error('Please select between 1 and 5 stars')
      return
    }

    setSubmittingId(player.id)
    try {
      await submitRating.mutateAsync({
        matchId,
        rateeId: player.id,
        stars: draft.stars,
        comment: draft.comment.trim() || null,
        noShow: Boolean(draft.noShow),
      })
      toast.success(`Rated ${player.full_name}!`)
    } catch (err) {
      toast.error(err?.message || 'Could not submit rating')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Match Players">
      {rateablePlayers.length === 0 ? (
        <p className={styles.emptyText}>No other participants to rate in this match.</p>
      ) : (
        <div className={styles.list}>
          {rateablePlayers.map((player) => {
            const rated = isAlreadyRated(player.id)
            const draft = getDraft(player.id)

            return (
              <div key={player.id} className={styles.playerCard}>
                <div className={styles.playerHeader}>
                  <div className={styles.playerIdentity}>
                    <Avatar src={player.avatar_url} name={player.full_name} size="sm" />
                    <div>
                      <div className={styles.playerName}>{player.full_name}</div>
                      <div className={styles.playerDept}>
                        {player.department || 'Student'} {player.year ? `• Year ${player.year}` : ''}
                      </div>
                    </div>
                  </div>
                  {rated && <span className={styles.ratedTag}>Rated ✓</span>}
                </div>

                {!rated && (
                  <div className={styles.formArea}>
                    <div className={styles.starsRow}>
                      <span className={styles.fieldLabel}>Rating:</span>
                      <StarRating
                        value={draft.stars}
                        onChange={(val) => updateDraft(player.id, { stars: val })}
                        size={22}
                      />
                    </div>

                    <textarea
                      className={styles.commentInput}
                      rows={2}
                      maxLength={250}
                      placeholder="Optional feedback (sportsmanship, punctuality)..."
                      value={draft.comment}
                      onChange={(e) => updateDraft(player.id, { comment: e.target.value })}
                    />

                    <div className={styles.bottomActions}>
                      <label className={styles.noShowCheck}>
                        <input
                          type="checkbox"
                          checked={draft.noShow}
                          onChange={(e) =>
                            updateDraft(player.id, { noShow: e.target.checked })
                          }
                        />
                        <span>Mark as No-show</span>
                      </label>

                      <Button
                        variant="primary"
                        size="sm"
                        loading={submittingId === player.id}
                        onClick={() => handleRate(player)}
                      >
                        Submit Rating
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}


import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Edit3,
  Settings as SettingsIcon,
  LogOut,
  Star,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useSports } from '../hooks/useSports'
import { useUserRatings } from '../hooks/useRatings'
import { supabase, isDemoMode } from '../lib/supabase'
import { getDb } from '../lib/mockBackend'
import { getSportEmoji } from '../components/MatchCard/MatchCard'
import Avatar from '../components/UI/Avatar'
import Badge from '../components/UI/Badge'
import Button from '../components/UI/Button'
import StarRating from '../components/UI/StarRating'
import Modal from '../components/UI/Modal'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import styles from './Profile.module.css'

const DEPARTMENTS = [
  { value: 'Computer Science', label: 'Computer Science (CSE)' },
  { value: 'Information Tech', label: 'Information Technology (IT)' },
  { value: 'Electronics & Comm.', label: 'Electronics & Comm. (ECE)' },
  { value: 'Electrical Eng.', label: 'Electrical Engineering (EEE)' },
  { value: 'Mechanical Eng.', label: 'Mechanical Engineering (ME)' },
  { value: 'Civil Engineering', label: 'Civil Engineering (CE)' },
  { value: 'Biotechnology', label: 'Biotechnology' },
  { value: 'Management / MBA', label: 'Management / MBA' },
]

const YEARS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
  { value: '5', label: '5th Year / PG' },
]

const SKILL_BADGE = {
  beginner: { label: 'Beginner', variant: 'success' },
  intermediate: { label: 'Intermediate', variant: 'warning' },
  advanced: { label: 'Advanced', variant: 'danger' },
}

export default function Profile() {
  const { id: paramUserId } = useParams()
  const navigate = useNavigate()
  const { user, profile: ownProfile, updateProfile, signOut } = useAuth()
  const { data: sports = [] } = useSports()

  const targetUserId = paramUserId || user?.id
  const isOwnProfile = !paramUserId || paramUserId === user?.id

  const [viewedProfile, setViewedProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(!isOwnProfile)
  const [canSeeContact, setCanSeeContact] = useState(isOwnProfile)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: reviews = [] } = useUserRatings(targetUserId)

  // Form state for editing own profile
  const [formState, setFormState] = useState({
    full_name: '',
    department: 'Computer Science',
    year: '1',
    contact: '',
    bio: '',
    skills: {},
  })

  useEffect(() => {
    if (isOwnProfile) {
      setViewedProfile(ownProfile)
      setCanSeeContact(true)
      setLoadingProfile(false)
      return
    }

    let active = true
    async function loadOtherProfile() {
      setLoadingProfile(true)
      if (isDemoMode) {
        const db = getDb()
        const prof = db.profiles.find((p) => p.id === targetUserId) || null
        if (prof) {
          const sportLevels = db.player_sport_levels.filter(
            (s) => s.user_id === targetUserId
          )
          // Check if current user and targetUserId share any match where both are host/accepted
          const sharedMatch = db.matches.some((m) => {
            const acceptedIds = new Set(
              db.match_participants
                .filter((mp) => mp.match_id === m.id && mp.status === 'accepted')
                .map((mp) => mp.user_id)
            )
            acceptedIds.add(m.host_id)
            return acceptedIds.has(user?.id) && acceptedIds.has(targetUserId)
          })
          if (active) {
            setCanSeeContact(sharedMatch)
            setViewedProfile({ ...prof, sport_levels: sportLevels })
          }
        }
        if (active) setLoadingProfile(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*, player_sport_levels(*)')
        .eq('id', targetUserId)
        .single()

      if (active) {
        setViewedProfile(
          data ? { ...data, sport_levels: data.player_sport_levels || [] } : null
        )
        setLoadingProfile(false)
      }
    }

    loadOtherProfile()
    return () => {
      active = false
    }
  }, [isOwnProfile, ownProfile, targetUserId, user?.id])

  const openEdit = () => {
    if (!viewedProfile) return
    const skillsMap = {}
    ;(viewedProfile.sport_levels || []).forEach((sl) => {
      skillsMap[sl.sport_id] = sl.skill_level
    })
    setFormState({
      full_name: viewedProfile.full_name || '',
      department: viewedProfile.department || 'Computer Science',
      year: String(viewedProfile.year || 1),
      contact: viewedProfile.contact || '',
      bio: viewedProfile.bio || '',
      skills: skillsMap,
    })
    setEditOpen(true)
  }

  const toggleSkill = (sportId, level) => {
    setFormState((prev) => {
      const nextSkills = { ...prev.skills }
      if (nextSkills[sportId] === level) {
        delete nextSkills[sportId]
      } else {
        nextSkills[sportId] = level
      }
      return { ...prev, skills: nextSkills }
    })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!formState.full_name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      const sportLevels = Object.entries(formState.skills).map(
        ([sport_id, skill_level]) => ({
          sport_id: Number(sport_id),
          skill_level,
        })
      )
      const { error } = await updateProfile(
        {
          full_name: formState.full_name.trim(),
          department: formState.department,
          year: Number(formState.year),
          contact: formState.contact.trim(),
          bio: formState.bio.trim(),
        },
        sportLevels
      )
      if (error) {
        toast.error(error.message || 'Could not update profile')
      } else {
        toast.success('Profile updated!')
        setEditOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading profile…</p>
      </div>
    )
  }

  if (!viewedProfile) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Player profile not found.</p>
      </div>
    )
  }

  const noShowCount = reviews.filter((r) => r.no_show).length
  const sportLevels = viewedProfile.sport_levels || []

  return (
    <div className={styles.page}>
      <div className={styles.profileCard}>
        <div className={styles.topSection}>
          <div className={styles.identityGroup}>
            <Avatar
              src={viewedProfile.avatar_url}
              name={viewedProfile.full_name}
              size="lg"
            />
            <div>
              <div className={styles.nameRow}>
                <h1 className={styles.name}>{viewedProfile.full_name}</h1>
                <Badge variant="info" size="sm">
                  {viewedProfile.roll_number}
                </Badge>
              </div>
              <p className={styles.deptLine}>
                {viewedProfile.department || 'Campus Student'}
                {viewedProfile.year ? ` • Year ${viewedProfile.year}` : ''}
              </p>
              {canSeeContact && viewedProfile.contact && (
                <p className={styles.contactLine}>
                  <Phone size={13} /> {viewedProfile.contact}
                </p>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <div className={styles.actionGroup}>
              <Button variant="secondary" size="sm" onClick={openEdit}>
                <Edit3 size={15} /> Edit Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <SettingsIcon size={15} /> Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut()
                  navigate('/login')
                }}
              >
                <LogOut size={15} /> Sign Out
              </Button>
            </div>
          )}
        </div>

        {viewedProfile.bio && <p className={styles.bio}>{viewedProfile.bio}</p>}

        {/* ---- Stats Grid ---- */}
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Average Rating</span>
            <div className={styles.statValueRow}>
              <Star size={18} fill="currentColor" className={styles.starIcon} />
              <strong className={styles.statNumber}>
                {Number(viewedProfile.avg_rating || 0) > 0
                  ? Number(viewedProfile.avg_rating).toFixed(1)
                  : '—'}
              </strong>
              <span className={styles.statSub}>
                ({viewedProfile.rating_count || 0} reviews)
              </span>
            </div>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>Matches Played</span>
            <div className={styles.statValueRow}>
              <Trophy size={18} className={styles.accentIcon} />
              <strong className={styles.statNumber}>
                {viewedProfile.matches_played || 0}
              </strong>
              <span className={styles.statSub}>completed</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>Reliability Record</span>
            <div className={styles.statValueRow}>
              {noShowCount === 0 ? (
                <>
                  <CheckCircle2 size={18} className={styles.goodIcon} />
                  <strong className={styles.statNumber}>100%</strong>
                  <span className={styles.statSub}>0 no-shows</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className={styles.warnIcon} />
                  <strong className={styles.statNumber}>{noShowCount}</strong>
                  <span className={styles.statSub}>no-show reported</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Skill Levels Per Sport ---- */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Sport Skill Levels</h2>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={openEdit}>
              Update Skills
            </Button>
          )}
        </div>

        {sportLevels.length === 0 ? (
          <p className={styles.emptyText}>No sport skill levels added yet.</p>
        ) : (
          <div className={styles.skillsGrid}>
            {sportLevels.map((sl) => {
              const sportObj = sports.find(
                (s) => Number(s.id) === Number(sl.sport_id)
              )
              const sportName = sportObj?.name || `Sport #${sl.sport_id}`
              const badge = SKILL_BADGE[sl.skill_level] || {
                label: sl.skill_level,
                variant: 'info',
              }
              return (
                <div key={sl.sport_id} className={styles.skillChip}>
                  <span className={styles.skillSport}>
                    {getSportEmoji(sportName)} {sportName}
                  </span>
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ---- Player Reviews ---- */}
      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          Recent Player Feedback ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className={styles.emptyText}>
            No ratings received yet. Complete a match to receive feedback!
          </p>
        ) : (
          <div className={styles.reviewList}>
            {reviews.map((rev) => (
              <div key={rev.id} className={styles.reviewItem}>
                <div className={styles.reviewTop}>
                  <span className={styles.reviewerName}>
                    {rev.rater?.full_name || 'Campus Player'}
                  </span>
                  <div className={styles.reviewBadges}>
                    {rev.no_show && (
                      <Badge variant="danger" size="sm">
                        No-Show
                      </Badge>
                    )}
                    <StarRating value={rev.stars} size={15} />
                  </div>
                </div>
                {rev.comment && (
                  <p className={styles.reviewComment}>{rev.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Edit Profile Modal ---- */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile & Sport Skill Levels"
      >
        <form onSubmit={handleSaveProfile} className={styles.editForm}>
          <Input
            label="Full Name"
            value={formState.full_name}
            onChange={(e) =>
              setFormState((p) => ({ ...p, full_name: e.target.value }))
            }
          />

          <Select
            label="Department"
            options={DEPARTMENTS}
            value={formState.department}
            onChange={(e) =>
              setFormState((p) => ({ ...p, department: e.target.value }))
            }
          />

          <Select
            label="Year"
            options={YEARS}
            value={formState.year}
            onChange={(e) =>
              setFormState((p) => ({ ...p, year: e.target.value }))
            }
          />

          <Input
            label="Phone / WhatsApp (Visible only to shared match players)"
            value={formState.contact}
            onChange={(e) =>
              setFormState((p) => ({ ...p, contact: e.target.value }))
            }
          />

          <Input
            label="Bio"
            type="textarea"
            rows={2}
            value={formState.bio}
            onChange={(e) =>
              setFormState((p) => ({ ...p, bio: e.target.value }))
            }
          />

          <div className={styles.skillSelectorList}>
            <span className={styles.skillSelectorHeading}>
              Skill Levels Per Sport
            </span>
            {sports.map((sport) => {
              const current = formState.skills[sport.id]
              return (
                <div key={sport.id} className={styles.skillSelectorRow}>
                  <span>
                    {getSportEmoji(sport.name)} {sport.name}
                  </span>
                  <div className={styles.levelBtnGroup}>
                    {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggleSkill(sport.id, lvl)}
                        className={`${styles.levelBtn} ${
                          current === lvl ? styles.levelBtnActive : ''
                        }`}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


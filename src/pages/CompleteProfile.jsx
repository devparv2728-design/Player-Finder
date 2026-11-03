import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { Trophy, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { useSports } from '../hooks/useSports'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import { getSportEmoji } from '../components/MatchCard/MatchCard'
import styles from './Auth.module.css'

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

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

export default function CompleteProfile() {
  const { profile, updateProfile } = useAuth()
  const { data: sports = [] } = useSports()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  // Map sport_id -> skill_level
  const [selectedSkills, setSelectedSkills] = useState(() => {
    const map = { 1: 'intermediate' } // default Badminton intermediate
    if (profile?.sport_levels) {
      profile.sport_levels.forEach((sl) => {
        map[sl.sport_id] = sl.skill_level
      })
    }
    return map
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      department: profile?.department || 'Computer Science',
      year: String(profile?.year || 1),
      contact: profile?.contact || '',
      bio: profile?.bio || '',
    },
  })

  const toggleSkill = (sportId, level) => {
    setSelectedSkills((prev) => {
      const next = { ...prev }
      if (next[sportId] === level) {
        delete next[sportId]
      } else {
        next[sportId] = level
      }
      return next
    })
  }

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const sportLevelsPayload = Object.entries(selectedSkills).map(
        ([sport_id, skill_level]) => ({
          sport_id: Number(sport_id),
          skill_level,
        })
      )

      const { error } = await updateProfile(
        {
          department: values.department,
          year: Number(values.year),
          contact: values.contact.trim(),
          bio: values.bio.trim(),
        },
        sportLevelsPayload
      )

      if (error) {
        toast.error(error.message || 'Could not update profile')
      } else {
        toast.success('Profile ready! Welcome to PlayerFinder.')
        navigate('/feed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={`${styles.authCard} ${styles.authCardWide}`}>
        <div className={styles.brandHeader}>
          <div className={styles.logoCircle}>
            <Trophy size={22} />
          </div>
          <h1 className={styles.title}>Complete Your Player Profile</h1>
          <p className={styles.subtitle}>
            Set your department, year, and sport skill levels so matches stay fair
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <Select
            label="Department"
            options={DEPARTMENTS}
            error={errors.department?.message}
            {...register('department', { required: 'Department is required' })}
          />

          <Select
            label="Academic Year"
            options={YEARS}
            error={errors.year?.message}
            {...register('year', { required: 'Year is required' })}
          />

          <Input
            label="Phone / WhatsApp (Shared ONLY with accepted match players)"
            placeholder="+91 98765 43210"
            icon={<Phone size={16} />}
            {...register('contact')}
          />

          <Input
            label="Short Bio (Optional)"
            type="textarea"
            rows={2}
            placeholder="When do you usually play? Any preferred courts?"
            {...register('bio')}
          />

          <div>
            <p className={styles.demoHeading} style={{ marginBottom: 8 }}>
              Select Your Skill Level Per Sport (Tap to toggle)
            </p>
            <div className={styles.skillsList}>
              {sports.map((sport) => {
                const currentLevel = selectedSkills[sport.id]
                return (
                  <div key={sport.id} className={styles.skillItem}>
                    <span className={styles.sportLabel}>
                      {getSportEmoji(sport.name)} {sport.name}
                    </span>
                    <div className={styles.levelPills}>
                      {SKILL_LEVELS.map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => toggleSkill(sport.id, lvl.id)}
                          className={`${styles.levelPill} ${
                            currentLevel === lvl.id ? styles.levelPillActive : ''
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth loading={submitting}>
            Save & Explore Matches
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => navigate('/feed')}
          >
            Skip for now
          </Button>
        </form>
      </div>
    </div>
  )
}

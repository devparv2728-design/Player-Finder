import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { MapPin, Users, Zap, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useSports } from '../hooks/useSports'
import { useCreateMatch } from '../hooks/useMatches'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import Button from '../components/UI/Button'
import styles from './Host.module.css'

const SKILL_OPTIONS = [
  { value: 'any', label: 'Any Skill Level (Open to all)' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const CAMPUS_VENUES = [
  'Indoor Sports Complex — Court 1',
  'Indoor Sports Complex — Court 2',
  'Student Activity Center — TT Hall',
  'Main Outdoor Basketball Court',
  'Campus Football Ground',
  'Main Cricket Oval Nets',
  'Central Library Chess Lounge',
  'Synthetic Tennis Court 1',
]

export default function Host() {
  const navigate = useNavigate()
  const { data: sports = [] } = useSports()
  const createMatch = useCreateMatch()

  // Default date: today or tomorrow, default time: 2 hours from now
  const defaultDateObj = new Date(Date.now() + 2 * 3600 * 1000)
  const defaultDateStr = defaultDateObj.toISOString().slice(0, 10)
  const defaultTimeStr = defaultDateObj.toTimeString().slice(0, 5)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      sport_id: '1',
      venue: '',
      date: defaultDateStr,
      time: defaultTimeStr,
      skill_level: 'intermediate',
      players_needed: 2,
      join_mode: 'instant',
      notes: '',
    },
  })

  const selectedSportId = watch('sport_id')
  const selectedJoinMode = watch('join_mode')

  // Update default players needed when sport changes
  useEffect(() => {
    const found = sports.find((s) => String(s.id) === String(selectedSportId))
    if (found?.default_players_needed) {
      setValue('players_needed', found.default_players_needed)
    }
  }, [selectedSportId, sports, setValue])

  const sportOptions = sports.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  const onSubmit = async (values) => {
    try {
      const combinedDate = new Date(`${values.date}T${values.time}`)
      if (isNaN(combinedDate.getTime()) || combinedDate <= new Date()) {
        toast.error('Please pick a date and time in the future.')
        return
      }

      const created = await createMatch.mutateAsync({
        sport_id: Number(values.sport_id),
        venue: values.venue,
        match_at: combinedDate.toISOString(),
        players_needed: Number(values.players_needed),
        skill_level: values.skill_level,
        join_mode: values.join_mode,
        notes: values.notes,
      })

      toast.success('Match hosted! You have been added as the first participant.')
      navigate(`/match/${created.id}`)
    } catch (err) {
      toast.error(err?.message || 'Failed to host match')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Host a Campus Match</h1>
          <p className={styles.subtitle}>
            Post a game in under a minute. You count as 1 accepted participant automatically.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.row2}>
            <Select
              label="Sport"
              options={sportOptions.length ? sportOptions : [{ value: '1', label: 'Badminton' }]}
              error={errors.sport_id?.message}
              {...register('sport_id', { required: 'Please choose a sport' })}
            />

            <Select
              label="Skill Level Required"
              options={SKILL_OPTIONS}
              error={errors.skill_level?.message}
              {...register('skill_level', { required: 'Skill level is required' })}
            />
          </div>

          <div>
            <Input
              label="Campus Venue / Court"
              placeholder="e.g. Indoor Sports Complex — Court 2"
              icon={<MapPin size={16} />}
              error={errors.venue?.message}
              {...register('venue', {
                required: 'Venue is required',
                maxLength: { value: 120, message: 'Keep venue under 120 characters' },
              })}
            />
            <div className={styles.venueChips}>
              {CAMPUS_VENUES.slice(0, 4).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={styles.venueChip}
                  onClick={() => setValue('venue', v, { shouldValidate: true })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row3}>
            <Input
              label="Match Date"
              type="date"
              error={errors.date?.message}
              {...register('date', { required: 'Date is required' })}
            />

            <Input
              label="Start Time (IST)"
              type="time"
              error={errors.time?.message}
              {...register('time', { required: 'Time is required' })}
            />

            <Input
              label="Total Players (incl. you)"
              type="number"
              min={2}
              max={24}
              icon={<Users size={16} />}
              error={errors.players_needed?.message}
              {...register('players_needed', {
                required: 'Total players required',
                min: { value: 2, message: 'At least 2 total players needed' },
                max: { value: 24, message: 'Maximum 24 players' },
              })}
            />
          </div>

          <div className={styles.modeSection}>
            <span className={styles.modeLabel}>Join Mode</span>
            <div className={styles.modeCards}>
              <label
                className={`${styles.modeCard} ${
                  selectedJoinMode === 'instant' ? styles.modeCardActive : ''
                }`}
              >
                <input
                  type="radio"
                  value="instant"
                  className="sr-only"
                  {...register('join_mode')}
                />
                <div className={styles.modeCardTitle}>
                  <Zap size={16} />
                  <span>Instant Join</span>
                </div>
                <p className={styles.modeCardDesc}>
                  First come, first served. Players join immediately until spots fill up.
                </p>
              </label>

              <label
                className={`${styles.modeCard} ${
                  selectedJoinMode === 'approval' ? styles.modeCardActive : ''
                }`}
              >
                <input
                  type="radio"
                  value="approval"
                  className="sr-only"
                  {...register('join_mode')}
                />
                <div className={styles.modeCardTitle}>
                  <ShieldCheck size={16} />
                  <span>Approval Required</span>
                </div>
                <p className={styles.modeCardDesc}>
                  Players send a join request. You review profiles & ratings before accepting.
                </p>
              </label>
            </div>
          </div>

          <Input
            label="Notes (Optional)"
            type="textarea"
            rows={3}
            placeholder="e.g. Bringing feather shuttles, non-marking shoes required..."
            error={errors.notes?.message}
            {...register('notes', {
              maxLength: { value: 400, message: 'Notes cannot exceed 400 characters' },
            })}
          />

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/feed')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMatch.isPending}
            >
              Publish Match
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


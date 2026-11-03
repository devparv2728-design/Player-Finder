import { Navigate, useNavigate } from 'react-router'
import {
  Trophy,
  Zap,
  ShieldCheck,
  Star,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import styles from './Landing.module.css'

const FEATURES = [
  {
    icon: Zap,
    title: 'Find Opponents in Under 30s',
    desc: 'Browse open campus games sorted by time, sport, and venue. Join instantly or request a spot.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Campus Identity',
    desc: 'Restricted to verified college email addresses and student roll numbers for a safe campus community.',
  },
  {
    icon: Star,
    title: 'Skill-Matched & Rated',
    desc: 'Filter by Beginner, Intermediate, or Advanced skill levels and check player reliability ratings.',
  },
  {
    icon: Users,
    title: 'Multi-Sport From Day One',
    desc: 'Built for Badminton singles & doubles, Table Tennis, Basketball, Football, Cricket, Chess, and more.',
  },
]

const SPORTS_PREVIEW = [
  '🏸 Badminton',
  '🏓 Table Tennis',
  '🏀 Basketball',
  '⚽ Football',
  '🏏 Cricket',
  '🏐 Volleyball',
  '♟️ Chess',
  '🎾 Tennis',
]

export default function Landing() {
  const { session, loading, demoQuickLogin, isDemoMode } = useAuth()
  const navigate = useNavigate()

  if (!loading && session) {
    return <Navigate to="/feed" replace />
  }

  const handleQuickDemo = async (userId) => {
    const { error } = await demoQuickLogin(userId)
    if (!error) {
      navigate('/feed')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Trophy size={20} />
          </div>
          <span className={styles.brandText}>PlayerFinder</span>
          <Badge variant="info" size="sm">
            Campus MVP
          </Badge>
        </div>

        <div className={styles.navActions}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.pillBanner}>
            <CheckCircle2 size={14} className={styles.pillIcon} />
            <span>Exclusively for verified college students</span>
          </div>

          <h1 className={styles.heroTitle}>
            Find your next game on campus —{' '}
            <span className={styles.gradientText}>tap and play.</span>
          </h1>

          <p className={styles.heroSub}>
            Don&apos;t let empty courts or busy friend circles stop your game. Host a
            match in under a minute, match with players of your skill level, and build
            your campus sports reputation.
          </p>

          <div className={styles.ctaGroup}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Start Playing <ArrowRight size={18} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
            >
              Sign In with Roll No.
            </Button>
          </div>

          {isDemoMode && (
            <div className={styles.demoBox}>
              <span className={styles.demoLabel}>
                Instant Campus Demo — Try as a Persona:
              </span>
              <div className={styles.personaBtns}>
                <button
                  type="button"
                  className={styles.personaBtn}
                  onClick={() => handleQuickDemo('user-aarav')}
                >
                  🏸 Aarav (2nd Yr • Host)
                </button>
                <button
                  type="button"
                  className={styles.personaBtn}
                  onClick={() => handleQuickDemo('user-meera')}
                >
                  🏓 Meera (1st Yr • Newcomer)
                </button>
                <button
                  type="button"
                  className={styles.personaBtn}
                  onClick={() => handleQuickDemo('user-rohan')}
                >
                  ⚡ Rohan (3rd Yr • Advanced)
                </button>
              </div>
            </div>
          )}

          <div className={styles.sportsTicker} aria-label="Supported campus sports">
            {SPORTS_PREVIEW.map((sport) => (
              <span key={sport} className={styles.sportChip}>
                {sport}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.featuresSection} aria-label="Key platform features">
          <div className={styles.featureGrid}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon size={20} />
                </div>
                <h2 className={styles.featureTitle}>{title}</h2>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>PlayerFinder v1.0 — Verified Campus Sports Matchmaking</span>
      </footer>
    </div>
  )
}

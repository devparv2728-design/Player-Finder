import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Mail, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, isDemoMode } from '../lib/supabase'
import Button from '../components/UI/Button'
import styles from './Auth.module.css'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your college email'
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0) return
    setCooldown(60)
    if (!isDemoMode && email.includes('@')) {
      await supabase.auth.resend({ type: 'signup', email })
    }
    toast.success('Verification email resent!')
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoCircle}>
            <Mail size={22} />
          </div>
          <h1 className={styles.title}>Check Your College Email</h1>
          <p className={styles.subtitle}>
            We sent a single-use verification link to <strong>{email}</strong>.
            Click the link to verify your campus identity.
          </p>
        </div>

        <div className={styles.form}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/complete-profile')}
          >
            Continue to Profile Setup <ArrowRight size={16} />
          </Button>

          <Button
            variant="secondary"
            fullWidth
            disabled={cooldown > 0}
            onClick={handleResend}
          >
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : 'Resend Verification Email'}
          </Button>
        </div>

        <p className={styles.footerText}>
          Already verified?{' '}
          <Link to="/login" className={styles.link}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

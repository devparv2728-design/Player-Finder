import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { Trophy, UserCheck, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'
import styles from './Auth.module.css'

export default function Login() {
  const { session, signIn, signInWithRollNumber, demoQuickLogin, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  if (session) {
    return <Navigate to="/feed" replace />
  }

  const onSubmit = async (values) => {
    setAuthError('')
    setSubmitting(true)
    try {
      const identifier = values.identifier.trim()
      const isEmail = identifier.includes('@')

      const result = isEmail
        ? await signIn({ email: identifier, password: values.password })
        : await signInWithRollNumber({
            rollNumber: identifier,
            password: values.password,
          })

      if (result.error) {
        setAuthError('Invalid credentials. Please check your college email/roll number and password.')
      } else {
        toast.success('Welcome back!')
        navigate('/feed')
      }
    } catch {
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickPersona = async (userId) => {
    const { error } = await demoQuickLogin(userId)
    if (!error) {
      toast.success('Signed in to campus demo!')
      navigate('/feed')
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <Link to="/" className={styles.logoCircle} aria-label="PlayerFinder Home">
            <Trophy size={22} />
          </Link>
          <h1 className={styles.title}>Sign in to PlayerFinder</h1>
          <p className={styles.subtitle}>
            Use your email address or roll number (e.g. 23CS101)
          </p>
        </div>

        {authError && (
          <div className={styles.errorBanner} role="alert">
            {authError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Email Address or Roll Number"
            placeholder="you@example.com or 23CS101"
            icon={<UserCheck size={16} />}
            error={errors.identifier?.message}
            {...register('identifier', {
              required: 'Please enter your email or roll number',
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password', {
              required: 'Please enter your password',
            })}
          />

          <div className={styles.rowBetween}>
            <span />
            <Link to="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="md" fullWidth loading={submitting}>
            Sign In
          </Button>
        </form>

        {isDemoMode && (
          <div className={styles.demoSection}>
            <span className={styles.demoHeading}>
              Quick Demo Accounts (Password: Password@123)
            </span>
            <div className={styles.demoGrid}>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => handleQuickPersona('user-aarav')}
              >
                <strong>Aarav Sharma</strong>
                <span>Roll: 23CS101 • Host</span>
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => handleQuickPersona('user-meera')}
              >
                <strong>Meera Nair</strong>
                <span>Roll: 24EC112 • 1st Yr</span>
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => handleQuickPersona('user-rohan')}
              >
                <strong>Rohan Verma</strong>
                <span>Roll: 22ME045 • 4.9★</span>
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => handleQuickPersona('user-priya')}
              >
                <strong>Priya Patel</strong>
                <span>Roll: 23IT088 • Casual</span>
              </button>
            </div>
          </div>
        )}

        <p className={styles.footerText}>
          Don&apos;t have an account?{' '}
          <Link to="/register" className={styles.link}>
            Register with College Email
          </Link>
        </p>
      </div>
    </div>
  )
}

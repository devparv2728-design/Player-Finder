import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { Trophy, User, Mail, Hash, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'
import styles from './Auth.module.css'

export default function Register() {
  const { session, signUp, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      rollNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  if (session) {
    return <Navigate to="/feed" replace />
  }

  const passwordVal = watch('password')

  const onSubmit = async (values) => {
    setAuthError('')
    setSubmitting(true)
    try {
      const { error } = await signUp({
        fullName: values.fullName,
        email: values.email,
        rollNumber: values.rollNumber,
        password: values.password,
      })

      if (error) {
        setAuthError(error.message || 'Unable to register with the provided details.')
      } else {
        toast.success('Account created! Let’s complete your player profile.')
        navigate(isDemoMode ? '/complete-profile' : '/verify-email', {
          state: { email: values.email },
        })
      }
    } catch {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <Link to="/" className={styles.logoCircle} aria-label="PlayerFinder Home">
            <Trophy size={22} />
          </Link>
          <h1 className={styles.title}>Create Player Account</h1>
          <p className={styles.subtitle}>
            Sign up with any email address to start hosting and joining campus games
          </p>
        </div>

        {authError && (
          <div className={styles.errorBanner} role="alert">
            {authError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Full Name"
            placeholder="e.g. Aarav Sharma"
            icon={<User size={16} />}
            error={errors.fullName?.message}
            {...register('fullName', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Enter at least 2 characters' },
            })}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com (any email)"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address',
              },
            })}
          />

          <Input
            label="Roll Number / Student ID (Optional)"
            placeholder="e.g. 23CS101 (optional)"
            icon={<Hash size={16} />}
            error={errors.rollNumber?.message}
            {...register('rollNumber')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            icon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            icon={<Lock size={16} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === passwordVal || 'Passwords do not match',
            })}
          />

          <Button type="submit" variant="primary" size="md" fullWidth loading={submitting}>
            Create Account
          </Button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

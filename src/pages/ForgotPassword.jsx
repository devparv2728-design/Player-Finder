import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { KeyRound, Mail } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
  })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      if (!isDemoMode) {
        await supabase.auth.resetPasswordForEmail(email.trim())
      }
      // Security rule (Flow 2): Always show generic message to prevent account enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoCircle}>
            <KeyRound size={22} />
          </div>
          <h1 className={styles.title}>Reset Your Password</h1>
          <p className={styles.subtitle}>
            Enter your college email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className={styles.successBanner} role="status">
            If an account exists for that college email, a single-use password reset
            link has been sent.
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="College Email"
              type="email"
              placeholder="you@college.edu.in"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Please enter your college email',
              })}
            />

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Send Reset Link
            </Button>
          </form>
        )}

        <p className={styles.footerText}>
          Remembered your password?{' '}
          <Link to="/login" className={styles.link}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}


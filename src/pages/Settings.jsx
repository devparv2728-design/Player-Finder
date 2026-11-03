import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { Lock, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/UI/Input'
import Button from '../components/UI/Button'
import Modal from '../components/UI/Modal'
import styles from './Settings.module.css'

export default function Settings() {
  const navigate = useNavigate()
  const { changePassword, deleteAccount } = useAuth()
  const [changingPass, setChangingPass] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassVal = watch('newPassword')

  const onPasswordSubmit = async (values) => {
    setChangingPass(true)
    try {
      const { error } = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (error) {
        toast.error(error.message || 'Could not update password')
      } else {
        toast.success('Password updated successfully!')
        reset()
      }
    } finally {
      setChangingPass(false)
    }
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await deleteAccount()
      if (error) {
        toast.error(error.message || 'Could not delete account')
      } else {
        toast.success('Your account and personal data have been deleted.')
        navigate('/')
      }
    } finally {
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
          <ArrowLeft size={16} /> Back to Profile
        </Button>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Account Settings</h1>
        <p className={styles.subtitle}>
          Manage your password and account privacy preferences
        </p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Change Password</h2>
        <form
          className={styles.form}
          onSubmit={handleSubmit(onPasswordSubmit)}
          noValidate
        >
          <Input
            label="Current Password"
            type="password"
            icon={<Lock size={16} />}
            error={errors.currentPassword?.message}
            {...register('currentPassword', {
              required: 'Enter your current password',
            })}
          />

          <Input
            label="New Password"
            type="password"
            icon={<Lock size={16} />}
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Enter a new password',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            icon={<Lock size={16} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Confirm your new password',
              validate: (v) => v === newPassVal || 'Passwords do not match',
            })}
          />

          <div>
            <Button type="submit" variant="primary" loading={changingPass}>
              Update Password
            </Button>
          </div>
        </form>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <div>
          <h2 className={styles.dangerTitle}>Delete Account</h2>
          <p className={styles.dangerDesc}>
            Permanently remove your student profile, hosted matches, and personal
            data from PlayerFinder. This action cannot be undone.
          </p>
        </div>
        <div>
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 size={16} /> Delete My Account
          </Button>
        </div>
      </section>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleConfirmDelete}
            >
              Yes, Permanently Delete
            </Button>
          </>
        }
      >
        <p className={styles.modalText}>
          Are you sure you want to delete your PlayerFinder account? All your
          hosted matches and profile information will be permanently removed.
        </p>
      </Modal>
    </div>
  )
}


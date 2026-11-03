import { useNavigate } from 'react-router'
import { Compass } from 'lucide-react'
import EmptyState from '../components/UI/EmptyState'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '80dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <EmptyState
        icon={Compass}
        title="404 — Page Not Found"
        description="The court or page you are looking for doesn’t exist."
        action={{
          label: 'Back to Home',
          onClick: () => navigate('/'),
        }}
      />
    </div>
  )
}


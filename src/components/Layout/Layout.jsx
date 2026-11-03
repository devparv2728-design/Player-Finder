import { NavLink, Outlet, useNavigate } from 'react-router'
import { Trophy, PlusCircle, Calendar, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../UI/Avatar'
import styles from './Layout.module.css'

const navItems = [
  { to: '/feed', label: 'Feed', icon: Trophy },
  { to: '/host', label: 'Host Match', icon: PlusCircle },
  { to: '/my-matches', label: 'My Matches', icon: Calendar },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Layout() {
  const { profile, user, signOut, isDemoMode } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.navBrand}>
          <div className={styles.brandLogo}>
            <Trophy size={20} aria-hidden="true" />
          </div>
          <div>
            <span className={styles.brandName}>PlayerFinder</span>
            {isDemoMode && <span className={styles.demoPill}>Campus Demo</span>}
          </div>
        </div>

        <div className={styles.navLinks}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              aria-label={label}
            >
              <Icon className={styles.navIcon} aria-hidden="true" />
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.navFooter}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Settings className={styles.navIcon} aria-hidden="true" />
            <span className={styles.navLabel}>Settings</span>
          </NavLink>

          <div className={styles.userCard}>
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || user?.email || 'Player'}
              size="sm"
            />
            <div className={styles.userMeta}>
              <span className={styles.userName}>
                {profile?.full_name || 'Student'}
              </span>
              <span className={styles.userRoll}>
                {profile?.roll_number || user?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutBtn}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'

import { AuthProvider } from './contexts/AuthContext'
import { QueryProvider } from './contexts/QueryProvider'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Layout/ProtectedRoute'

// ---- Lazy-loaded pages ----
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Feed = lazy(() => import('./pages/Feed'))
const Host = lazy(() => import('./pages/Host'))
const MatchDetail = lazy(() => import('./pages/MatchDetail'))
const MyMatches = lazy(() => import('./pages/MyMatches'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60dvh',
      }}
    >
      <Loader2
        size={28}
        style={{
          color: 'var(--color-accent)',
          animation: 'spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
      <span className="sr-only">Loading page…</span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryProvider>
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              },
            }}
          />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ---- Public routes ---- */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* ---- Protected routes (with layout) ---- */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/host" element={<Host />} />
                  <Route path="/match/:id" element={<MatchDetail />} />
                  <Route path="/my-matches" element={<MyMatches />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* ---- Catch-all ---- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

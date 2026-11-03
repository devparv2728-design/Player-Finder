import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { getDb, saveDb, getStoredSession, setStoredSession } from '../lib/mockBackend'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (isDemoMode) {
      const db = getDb()
      const prof = db.profiles.find((p) => p.id === userId) || null
      if (prof) {
        const sportLevels = db.player_sport_levels.filter((s) => s.user_id === userId)
        return { ...prof, sport_levels: sportLevels }
      }
      return null
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, player_sport_levels(*)')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message)
        return null
      }
      return data
        ? { ...data, sport_levels: data.player_sport_levels || [] }
        : null
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null
    const updated = await fetchProfile(user.id)
    setProfile(updated)
    return updated
  }, [user, fetchProfile])

  useEffect(() => {
    let mounted = true

    async function init() {
      if (isDemoMode) {
        const saved = getStoredSession()
        if (saved?.user) {
          setSession(saved)
          setUser(saved.user)
          const prof = await fetchProfile(saved.user.id)
          if (mounted) setProfile(prof)
        }
        if (mounted) setLoading(false)
        return
      }

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id)
          if (mounted) setProfile(profileData)
        }
      } catch (err) {
        console.error('Error initialising auth:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    if (isDemoMode) {
      const handleDbChange = () => {
        const saved = getStoredSession()
        if (saved?.user) {
          fetchProfile(saved.user.id).then((prof) => {
            if (mounted) setProfile(prof)
          })
        }
      }
      window.addEventListener('playerfinder-db-change', handleDbChange)
      return () => {
        mounted = false
        window.removeEventListener('playerfinder-db-change', handleDbChange)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id)
        if (mounted) setProfile(profileData)
      } else {
        setProfile(null)
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signUp = useCallback(
    async ({ email, password, fullName, rollNumber }) => {
      const normalizedEmail = (email || '').trim().toLowerCase()
      const normalizedRoll = (rollNumber || '').trim()
        ? rollNumber.trim().toUpperCase()
        : `STU-${Date.now().toString().slice(-6)}`

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedEmail)) {
        return {
          data: null,
          error: { message: 'Please enter a valid email address.' },
        }
      }

      if (isDemoMode) {
        const db = getDb()
        const existingEmail = db.users.find((u) => u.email.toLowerCase() === normalizedEmail)
        const existingRoll = db.profiles.find((p) => p.roll_number.toUpperCase() === normalizedRoll)

        if (existingEmail || existingRoll) {
          // Generic error per AUTH-5 / Flow 1 security rule
          return {
            data: null,
            error: { message: 'Unable to register with the provided email or roll number.' },
          }
        }

        const newUserId = `user-${Date.now()}`
        const newUser = {
          id: newUserId,
          email: normalizedEmail,
          password,
          email_confirmed_at: new Date().toISOString(),
        }
        const newProfile = {
          id: newUserId,
          full_name: fullName.trim(),
          roll_number: normalizedRoll,
          department: '',
          year: 1,
          contact: '',
          avatar_url: '',
          bio: '',
          avg_rating: 0,
          rating_count: 0,
          matches_played: 0,
          created_at: new Date().toISOString(),
        }

        db.users.push(newUser)
        db.profiles.push(newProfile)
        saveDb(db)

        const newSession = {
          access_token: `demo-jwt-${newUserId}`,
          user: { id: newUserId, email: normalizedEmail, email_confirmed_at: newUser.email_confirmed_at },
        }
        setStoredSession(newSession)
        setSession(newSession)
        setUser(newSession.user)
        setProfile({ ...newProfile, sport_levels: [] })

        return { data: { user: newSession.user, session: newSession }, error: null }
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            roll_number: normalizedRoll,
          },
        },
      })
      return { data, error }
    },
    []
  )

  const signIn = useCallback(
    async ({ email, password }) => {
      const normalizedEmail = email.trim().toLowerCase()

      if (isDemoMode) {
        const db = getDb()
        const foundUser = db.users.find(
          (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
        )
        if (!foundUser) {
          return {
            data: null,
            error: { message: 'Invalid login credentials.' },
          }
        }
        const newSession = {
          access_token: `demo-jwt-${foundUser.id}`,
          user: {
            id: foundUser.id,
            email: foundUser.email,
            email_confirmed_at: foundUser.email_confirmed_at,
          },
        }
        setStoredSession(newSession)
        setSession(newSession)
        setUser(newSession.user)
        const prof = await fetchProfile(foundUser.id)
        setProfile(prof)
        return { data: { user: newSession.user, session: newSession }, error: null }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      return { data, error }
    },
    [fetchProfile]
  )

  const signInWithRollNumber = useCallback(
    async ({ rollNumber, password }) => {
      const normalizedRoll = rollNumber.trim().toUpperCase()

      if (isDemoMode) {
        const db = getDb()
        const prof = db.profiles.find(
          (p) => p.roll_number.toUpperCase() === normalizedRoll
        )
        const resolvedEmail = prof
          ? db.users.find((u) => u.id === prof.id)?.email
          : `${normalizedRoll}@placeholder.invalid`

        return signIn({ email: resolvedEmail || 'invalid@placeholder.invalid', password })
      }

      const { data: email, error: rpcError } = await supabase.rpc(
        'get_email_by_roll_number',
        { roll: normalizedRoll }
      )

      if (rpcError || !email) {
        return {
          data: null,
          error: { message: 'Invalid login credentials.' },
        }
      }

      return signIn({ email, password })
    },
    [signIn]
  )

  const demoQuickLogin = useCallback(
    async (userId) => {
      const db = getDb()
      const foundUser = db.users.find((u) => u.id === userId)
      if (!foundUser) return { error: { message: 'Demo user not found' } }
      return signIn({ email: foundUser.email, password: foundUser.password })
    },
    [signIn]
  )

  const signOut = useCallback(async () => {
    if (isDemoMode) {
      setStoredSession(null)
      setUser(null)
      setSession(null)
      setProfile(null)
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
    return { error }
  }, [])

  const updateProfile = useCallback(
    async (updates, sportLevels = null) => {
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } }
      }

      if (isDemoMode) {
        const db = getDb()
        const idx = db.profiles.findIndex((p) => p.id === user.id)
        if (idx === -1) {
          return { data: null, error: { message: 'Profile not found' } }
        }
        // Prevent modifying protected aggregate fields
        const { id: _id, avg_rating: _ar, rating_count: _rc, matches_played: _mp, ...safeUpdates } = updates
        db.profiles[idx] = { ...db.profiles[idx], ...safeUpdates }

        if (Array.isArray(sportLevels)) {
          db.player_sport_levels = db.player_sport_levels.filter(
            (s) => s.user_id !== user.id
          )
          sportLevels.forEach((sl) => {
            if (sl.sport_id && sl.skill_level) {
              db.player_sport_levels.push({
                user_id: user.id,
                sport_id: Number(sl.sport_id),
                skill_level: sl.skill_level,
              })
            }
          })
        }

        saveDb(db)
        const updated = await fetchProfile(user.id)
        setProfile(updated)
        return { data: updated, error: null }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (!error && Array.isArray(sportLevels)) {
        await supabase.from('player_sport_levels').delete().eq('user_id', user.id)
        if (sportLevels.length > 0) {
          await supabase.from('player_sport_levels').insert(
            sportLevels.map((sl) => ({
              user_id: user.id,
              sport_id: Number(sl.sport_id),
              skill_level: sl.skill_level,
            }))
          )
        }
      }

      const updated = await fetchProfile(user.id)
      setProfile(updated)
      return { data: updated || data, error }
    },
    [user, fetchProfile]
  )

  const changePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      if (!user) return { error: { message: 'Not authenticated' } }

      if (isDemoMode) {
        const db = getDb()
        const uIdx = db.users.findIndex((u) => u.id === user.id)
        if (uIdx === -1 || db.users[uIdx].password !== currentPassword) {
          return { error: { message: 'Current password is incorrect.' } }
        }
        db.users[uIdx].password = newPassword
        saveDb(db)
        return { error: null }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error }
    },
    [user]
  )

  const deleteAccount = useCallback(async () => {
    if (!user) return { error: { message: 'Not authenticated' } }

    if (isDemoMode) {
      const db = getDb()
      db.users = db.users.filter((u) => u.id !== user.id)
      db.profiles = db.profiles.filter((p) => p.id !== user.id)
      db.matches = db.matches.filter((m) => m.host_id !== user.id)
      db.match_participants = db.match_participants.filter((mp) => mp.user_id !== user.id)
      saveDb(db)
      await signOut()
      return { error: null }
    }

    await signOut()
    return { error: null }
  }, [user, signOut])

  const value = {
    user,
    session,
    profile,
    loading,
    isDemoMode,
    signUp,
    signIn,
    signInWithRollNumber,
    demoQuickLogin,
    signOut,
    updateProfile,
    refreshProfile,
    changePassword,
    deleteAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

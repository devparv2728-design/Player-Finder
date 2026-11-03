import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isDemoMode } from '../lib/supabase'
import { getDb, saveDb, enrichMatch } from '../lib/mockBackend'
import { useAuth } from '../contexts/AuthContext'

export function useOpenMatches(filters = {}, limit = 20) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['matches', 'open', filters, limit, user?.id],
    queryFn: async () => {
      const nowIso = new Date().toISOString()

      if (isDemoMode) {
        const db = getDb()
        let list = db.matches
          .filter((m) => m.status === 'open' && m.match_at > nowIso)
          .sort((a, b) => new Date(a.match_at) - new Date(b.match_at))

        if (filters.sportId) {
          list = list.filter((m) => String(m.sport_id) === String(filters.sportId))
        }
        if (filters.skillLevel) {
          list = list.filter((m) => m.skill_level === filters.skillLevel)
        }
        if (filters.date) {
          list = list.filter((m) => m.match_at.slice(0, 10) === filters.date)
        }

        return list.slice(0, limit).map((m) => enrichMatch(db, m, user?.id))
      }

      let query = supabase
        .from('matches')
        .select(
          `
          *,
          sport:sports(*),
          host:profiles!matches_host_id_fkey(id, full_name, avatar_url, avg_rating, rating_count, department, year),
          participants:match_participants(id, user_id, status)
        `
        )
        .eq('status', 'open')
        .gt('match_at', nowIso)
        .order('match_at', { ascending: true })
        .limit(limit)

      if (filters.sportId) {
        query = query.eq('sport_id', Number(filters.sportId))
      }
      if (filters.skillLevel) {
        query = query.eq('skill_level', filters.skillLevel)
      }
      if (filters.date) {
        const startOfDay = `${filters.date}T00:00:00.000Z`
        const endOfDay = `${filters.date}T23:59:59.999Z`
        query = query.gte('match_at', startOfDay).lte('match_at', endOfDay)
      }

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((m) => ({
        ...m,
        accepted_count: (m.participants || []).filter((p) => p.status === 'accepted').length,
      }))
    },
  })
}

export function useMatch(matchId) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['match', matchId, user?.id],
    enabled: Boolean(matchId),
    queryFn: async () => {
      if (isDemoMode) {
        const db = getDb()
        const found = db.matches.find((m) => m.id === matchId)
        if (!found) throw new Error('Match not found')
        return enrichMatch(db, found, user?.id)
      }

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          sport:sports(*),
          host:profiles!matches_host_id_fkey(*),
          participants:match_participants(*, profile:profiles(*))
        `
        )
        .eq('id', matchId)
        .single()

      if (error) throw error

      return {
        ...data,
        accepted_count: (data.participants || []).filter((p) => p.status === 'accepted').length,
        pending_count: (data.participants || []).filter((p) => p.status === 'pending').length,
      }
    },
  })
}

export function useMyMatches() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['matches', 'my', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (isDemoMode) {
        const db = getDb()
        const allEnriched = db.matches
          .slice()
          .sort((a, b) => new Date(a.match_at) - new Date(b.match_at))
          .map((m) => enrichMatch(db, m, user.id))

        const hosting = allEnriched.filter((m) => m.host_id === user.id)
        const joined = allEnriched.filter(
          (m) =>
            m.host_id !== user.id &&
            m.participants.some((p) => p.user_id === user.id && p.status === 'accepted')
        )
        const pending = allEnriched.filter(
          (m) =>
            m.host_id !== user.id &&
            m.participants.some((p) => p.user_id === user.id && p.status === 'pending')
        )

        return { hosting, joined, pending }
      }

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          sport:sports(*),
          host:profiles!matches_host_id_fkey(*),
          participants:match_participants(*, profile:profiles(*))
        `
        )
        .order('match_at', { ascending: true })

      if (error) throw error

      const all = (data || []).map((m) => ({
        ...m,
        accepted_count: (m.participants || []).filter((p) => p.status === 'accepted').length,
        pending_count: (m.participants || []).filter((p) => p.status === 'pending').length,
      }))

      return {
        hosting: all.filter((m) => m.host_id === user.id),
        joined: all.filter(
          (m) =>
            m.host_id !== user.id &&
            (m.participants || []).some((p) => p.user_id === user.id && p.status === 'accepted')
        ),
        pending: all.filter(
          (m) =>
            m.host_id !== user.id &&
            (m.participants || []).some((p) => p.user_id === user.id && p.status === 'pending')
        ),
      }
    },
  })
}

export function useCreateMatch() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (payload) => {
      if (!user) throw new Error('You must be logged in to host a match.')

      const matchAtDate = new Date(payload.match_at)
      if (matchAtDate <= new Date()) {
        throw new Error('Match date and time must be in the future.')
      }

      if (isDemoMode) {
        const db = getDb()
        const newMatchId = `match-${Date.now()}`
        const newMatch = {
          id: newMatchId,
          host_id: user.id,
          sport_id: Number(payload.sport_id),
          venue: payload.venue.trim(),
          match_at: matchAtDate.toISOString(),
          players_needed: Number(payload.players_needed),
          skill_level: payload.skill_level,
          join_mode: payload.join_mode,
          status: 'open',
          notes: payload.notes ? payload.notes.trim() : '',
          created_at: new Date().toISOString(),
        }

        // HOST-5: Host counts as an accepted participant automatically
        db.matches.push(newMatch)
        db.match_participants.push({
          id: `mp-${Date.now()}`,
          match_id: newMatchId,
          user_id: user.id,
          status: 'accepted',
          created_at: new Date().toISOString(),
        })
        saveDb(db)
        return newMatch
      }

      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          host_id: user.id,
          sport_id: Number(payload.sport_id),
          venue: payload.venue.trim(),
          match_at: matchAtDate.toISOString(),
          players_needed: Number(payload.players_needed),
          skill_level: payload.skill_level,
          join_mode: payload.join_mode,
          status: 'open',
          notes: payload.notes ? payload.notes.trim() : null,
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('match_participants').insert({
        match_id: match.id,
        user_id: user.id,
        status: 'accepted',
      })

      return match
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

export function useJoinMatch() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (matchId) => {
      if (!user) throw new Error('Not authenticated')

      if (isDemoMode) {
        const db = getDb()
        const match = db.matches.find((m) => m.id === matchId)
        if (!match) throw new Error('Match not found')
        if (match.host_id === user.id) throw new Error('Cannot join your own match')
        if (match.status !== 'open') throw new Error('Match is not open for joining')
        if (new Date(match.match_at) <= new Date()) throw new Error('Match has already passed')

        const existing = db.match_participants.find(
          (mp) => mp.match_id === matchId && mp.user_id === user.id
        )
        if (existing && (existing.status === 'accepted' || existing.status === 'pending')) {
          throw new Error('Already joined or requested')
        }

        const acceptedCount = db.match_participants.filter(
          (mp) => mp.match_id === matchId && mp.status === 'accepted'
        ).length

        if (acceptedCount >= match.players_needed) {
          throw new Error('Match is full')
        }

        const newStatus = match.join_mode === 'instant' ? 'accepted' : 'pending'

        if (existing) {
          existing.status = newStatus
        } else {
          db.match_participants.push({
            id: `mp-${Date.now()}`,
            match_id: matchId,
            user_id: user.id,
            status: newStatus,
            created_at: new Date().toISOString(),
          })
        }

        if (newStatus === 'accepted' && acceptedCount + 1 >= match.players_needed) {
          match.status = 'full'
        }

        saveDb(db)
        return newStatus
      }

      const { data, error } = await supabase.rpc('join_match', { p_match_id: matchId })
      if (error) throw error
      return data
    },
    onSuccess: (_data, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['match', matchId] })
    },
  })
}

export function useManageParticipant() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ matchId, participantUserId, action }) => {
      if (!user) throw new Error('Not authenticated')

      if (isDemoMode) {
        const db = getDb()
        const match = db.matches.find((m) => m.id === matchId)
        if (!match) throw new Error('Match not found')

        if (action === 'accept') {
          if (match.host_id !== user.id) throw new Error('Only host can accept requests')
          const acceptedCount = db.match_participants.filter(
            (mp) => mp.match_id === matchId && mp.status === 'accepted'
          ).length
          if (acceptedCount >= match.players_needed) throw new Error('Match is already full')

          const mp = db.match_participants.find(
            (p) => p.match_id === matchId && p.user_id === participantUserId
          )
          if (mp) mp.status = 'accepted'
          if (acceptedCount + 1 >= match.players_needed) {
            match.status = 'full'
          }
        } else if (action === 'reject') {
          if (match.host_id !== user.id) throw new Error('Only host can reject requests')
          const mp = db.match_participants.find(
            (p) => p.match_id === matchId && p.user_id === participantUserId
          )
          if (mp) mp.status = 'rejected'
        } else if (action === 'leave') {
          if (match.host_id === user.id) {
            throw new Error('Host cannot leave their own match. Cancel it instead.')
          }
          const mp = db.match_participants.find(
            (p) => p.match_id === matchId && p.user_id === user.id
          )
          if (mp) mp.status = 'withdrawn'

          const remainingAccepted = db.match_participants.filter(
            (p) => p.match_id === matchId && p.status === 'accepted'
          ).length
          if (match.status === 'full' && remainingAccepted < match.players_needed) {
            match.status = 'open'
          }
        }

        saveDb(db)
        return true
      }

      if (action === 'accept') {
        const { error } = await supabase.rpc('accept_join_request', {
          p_match_id: matchId,
          p_user_id: participantUserId,
        })
        if (error) throw error
      } else if (action === 'reject') {
        const { error } = await supabase.rpc('reject_join_request', {
          p_match_id: matchId,
          p_user_id: participantUserId,
        })
        if (error) throw error
      } else if (action === 'leave') {
        const { error } = await supabase.rpc('leave_match', { p_match_id: matchId })
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['match', vars.matchId] })
    },
  })
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient()
  const { user, refreshProfile } = useAuth()

  return useMutation({
    mutationFn: async ({ matchId, action, updates }) => {
      if (!user) throw new Error('Not authenticated')

      if (isDemoMode) {
        const db = getDb()
        const match = db.matches.find((m) => m.id === matchId)
        if (!match) throw new Error('Match not found')
        if (match.host_id !== user.id) throw new Error('Only the host can modify this match')

        if (action === 'cancel') {
          match.status = 'cancelled'
        } else if (action === 'complete') {
          match.status = 'completed'
          const acceptedUserIds = new Set(
            db.match_participants
              .filter((mp) => mp.match_id === matchId && mp.status === 'accepted')
              .map((mp) => mp.user_id)
          )
          acceptedUserIds.add(match.host_id)
          db.profiles.forEach((p) => {
            if (acceptedUserIds.has(p.id)) {
              p.matches_played = (p.matches_played || 0) + 1
            }
          })
        } else if (action === 'edit' && updates) {
          if (match.status !== 'open' && match.status !== 'full') {
            throw new Error('Cannot edit a completed or cancelled match')
          }
          Object.assign(match, updates)
        }

        saveDb(db)
        await refreshProfile()
        return match
      }

      if (action === 'cancel') {
        const { error } = await supabase.rpc('cancel_match', { p_match_id: matchId })
        if (error) throw error
      } else if (action === 'complete') {
        const { error } = await supabase.rpc('complete_match', { p_match_id: matchId })
        if (error) throw error
        await refreshProfile()
      } else if (action === 'edit' && updates) {
        const { error } = await supabase.from('matches').update(updates).eq('id', matchId)
        if (error) throw error
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['match', vars.matchId] })
    },
  })
}


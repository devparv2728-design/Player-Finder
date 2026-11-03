import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isDemoMode } from '../lib/supabase'
import { getDb, saveDb } from '../lib/mockBackend'
import { useAuth } from '../contexts/AuthContext'

export function useMatchRatings(matchId) {
  return useQuery({
    queryKey: ['ratings', matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      if (isDemoMode) {
        const db = getDb()
        return db.ratings.filter((r) => r.match_id === matchId)
      }

      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('match_id', matchId)

      if (error) throw error
      return data || []
    },
  })
}

export function useUserRatings(userId) {
  return useQuery({
    queryKey: ['user-ratings', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (isDemoMode) {
        const db = getDb()
        return db.ratings
          .filter((r) => r.ratee_id === userId)
          .map((r) => ({
            ...r,
            rater: db.profiles.find((p) => p.id === r.rater_id) || null,
          }))
      }

      const { data, error } = await supabase
        .from('ratings')
        .select('*, rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url)')
        .eq('ratee_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useSubmitRating() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ matchId, rateeId, stars, comment, noShow = false }) => {
      if (!user) throw new Error('Not authenticated')
      if (user.id === rateeId) throw new Error('Cannot rate yourself')

      if (isDemoMode) {
        const db = getDb()
        const match = db.matches.find((m) => m.id === matchId)
        if (!match || match.status !== 'completed') {
          throw new Error('Match must be completed before rating.')
        }

        const duplicate = db.ratings.find(
          (r) =>
            r.match_id === matchId && r.rater_id === user.id && r.ratee_id === rateeId
        )
        if (duplicate) {
          throw new Error('You have already rated this player for this match.')
        }

        const newRating = {
          id: `rating-${Date.now()}`,
          match_id: matchId,
          rater_id: user.id,
          ratee_id: rateeId,
          stars: Number(stars),
          comment: comment || null,
          no_show: Boolean(noShow),
          created_at: new Date().toISOString(),
        }
        db.ratings.push(newRating)

        // Trigger behavior: recompute average rating & count for ratee
        const rateeRatings = db.ratings.filter((r) => r.ratee_id === rateeId)
        const sum = rateeRatings.reduce((acc, r) => acc + Number(r.stars), 0)
        const avg = Math.round((sum / rateeRatings.length) * 100) / 100

        const prof = db.profiles.find((p) => p.id === rateeId)
        if (prof) {
          prof.avg_rating = avg
          prof.rating_count = rateeRatings.length
        }

        saveDb(db)
        return newRating
      }

      const { error } = await supabase.rpc('submit_rating', {
        p_match_id: matchId,
        p_ratee_id: rateeId,
        p_stars: Number(stars),
        p_comment: comment || null,
        p_no_show: Boolean(noShow),
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', vars.matchId] })
      queryClient.invalidateQueries({ queryKey: ['user-ratings', vars.rateeId] })
      queryClient.invalidateQueries({ queryKey: ['match', vars.matchId] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}


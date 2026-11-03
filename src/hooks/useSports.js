import { useQuery } from '@tanstack/react-query'
import { supabase, isDemoMode } from '../lib/supabase'
import { getDb } from '../lib/mockBackend'

export function useSports() {
  return useQuery({
    queryKey: ['sports'],
    staleTime: 1000 * 60 * 30, // 30 minutes
    queryFn: async () => {
      if (isDemoMode) {
        const db = getDb()
        return db.sports
      }

      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      return data || []
    },
  })
}


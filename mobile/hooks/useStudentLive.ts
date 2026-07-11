import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { LiveClass } from '@shared/types'

export function useStudentLive() {
  return useQuery<{ classes: LiveClass[] }, Error>({
    queryKey: ['studentLive'],
    queryFn: () => apiFetch('/api/dashboard/live'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

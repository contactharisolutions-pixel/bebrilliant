import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { UserProfile } from '@shared/types'

export function useStudents() {
  return useQuery<UserProfile[], Error>({
    queryKey: ['students'],
    queryFn: () => apiFetch('/api/dashboard/students'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

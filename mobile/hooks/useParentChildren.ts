import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { UserProfile } from '@shared/types'

export function useParentChildren() {
  return useQuery<UserProfile[], Error>({
    queryKey: ['parentChildren'],
    queryFn: () => apiFetch('/api/parent/children'),
    staleTime: 1000 * 60 * 10, // Cache list of children for 10 minutes
  })
}

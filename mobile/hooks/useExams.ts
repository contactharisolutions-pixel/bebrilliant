import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { Exam } from '@shared/types'

export function useExams() {
  return useQuery<{ exams: Exam[]; subjects: any[] }, Error>({
    queryKey: ['exams'],
    queryFn: () => apiFetch('/api/dashboard/exams'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

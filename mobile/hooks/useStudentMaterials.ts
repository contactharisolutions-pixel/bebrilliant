import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

interface Material {
  id: string
  title: string
  type: 'pdf' | 'video' | 'notes' | 'assignment'
  subject: string
  class_name: string
  file_url: string
  file_size?: string
}

export function useStudentMaterials() {
  return useQuery<Material[], Error>({
    queryKey: ['studentMaterials'],
    queryFn: () => apiFetch('/api/dashboard/material'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

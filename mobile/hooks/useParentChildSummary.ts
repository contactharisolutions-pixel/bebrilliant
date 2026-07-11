import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'

interface ScoreRecord {
  id: string
  marks_obtained: number
  total_marks: number
  percentage: number
  exam_date: string
  subject: string
  exam_name: string
}

interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'late'
}

interface ChildSummary {
  attendanceRate: number
  absentCount: number
  avgScore: number
  completedExams: number
  recentScores: ScoreRecord[]
  attendanceLogs: AttendanceRecord[]
}

export function useParentChildSummary(childId: string | null) {
  return useQuery<ChildSummary, Error>({
    queryKey: ['parentChildSummary', childId],
    queryFn: () => apiFetch(`/api/parent/child-summary?childId=${childId}`),
    enabled: !!childId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

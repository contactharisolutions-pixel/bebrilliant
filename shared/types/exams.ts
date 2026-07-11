export interface Question {
    id: string
    tenant_id: string
    type: 'objective' | 'subjective'
    sub_type?: 'mcq' | 'numerical' | 'descriptive'
    question_text: Record<string, string> // e.g. {"en": "...", "hi": "..."}
    options?: Record<string, string> // e.g. {"A": "...", "B": "..."}
    correct_answer?: any
    explanation?: Record<string, string>
    subject_id?: string | null
    chapter_id?: string | null
    topic_id?: string | null
    difficulty?: 'easy' | 'medium' | 'hard'
    marks: number
    negative_marks?: number
    source?: 'manual' | 'ai' | 'import'
    created_by?: string | null
    created_at?: string
    updated_at?: string
}

export interface ExamConfig {
    exam_id: string
    total_questions: number
    total_marks: number
    negative_marking: boolean
    must_attempt?: number | null
    randomization_mode: 'none' | 'shuffled' | 'pool' | 'adaptive'
    allow_language_switch: boolean
}

export interface Exam {
    id: string
    tenant_id: string
    name: string
    description?: string | null
    category_id?: string | null
    is_paid: boolean
    price: number
    start_time?: string | null
    end_time?: string | null
    duration?: number | null // in minutes
    allow_anytime: boolean
    created_by?: string | null
    created_at?: string
    updated_at?: string
    config?: ExamConfig
    questions?: Question[]
}

export interface ExamAttempt {
    id: string
    student_id: string
    exam_id: string
    start_time?: string
    end_time?: string | null
    status: 'in_progress' | 'submitted' | 'evaluated'
    total_score?: number | null
    exam?: Exam
}

export interface Answer {
    id: string
    attempt_id: string
    question_id: string
    answer?: any
    is_correct?: boolean | null
    marks_awarded: number
}

export interface LiveClass {
    id: string
    title: string
    scheduled_at: string
    duration_minutes: number
    status: string // e.g., 'scheduled', 'live', 'completed'
    join_url: string
    auto_record: boolean
    teacher_id?: string
    teacher?: {
        first_name: string
        last_name: string
    }
}

export interface WalletTransaction {
    id: string
    user_id: string
    amount: number
    type: 'credit' | 'debit'
    description?: string | null
    created_at: string
}

export interface StudentWallet {
    id: string
    student_id: string
    balance: number
    tenant_id: string
    created_at: string
}

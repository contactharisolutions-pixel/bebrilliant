'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
    Printer, FileText, Download, Share2, PlusCircle, LayoutDashboard,
    Search, ArrowLeft, Loader2, BookOpen, Target, Clock, ChevronRight,
    Zap, Sparkles, Database, Settings, Shield, Globe, Building2, Trash2,
    CheckCircle, XCircle, Copy, Layers, Sliders, Eye, RefreshCw,
    FileSpreadsheet, ArrowUpRight, Award, Check, HelpCircle, Filter,
    Pencil, Plus, AlertCircle, X, ChevronLeft, FolderPlus, FolderOpen,
    Tag, CheckCircle2, RotateCcw, ListFilter
} from 'lucide-react'
import ExamSyllabusPatternPicker, { BlueprintContextData } from '@/components/shared/ExamSyllabusPatternPicker'

// Initial state for pattern editor modal
const initialPatternForm = {
    id: '',
    name: '',
    description: '',
    category: 'Board Standard',
    exam_type: 'descriptive',
    total_marks: 80,
    duration_minutes: 180,
    instructions: '1. All questions are compulsory.\n2. Write answers clearly and neatly.\n3. Marks are indicated against each question.',
    is_owner_pattern: false,
    sections: [
        {
            section_name: 'Section A - Objective Questions',
            section_type: 'objective',
            instructions: 'Multiple choice questions. Choose the correct option.',
            rules: [
                {
                    question_type: 'mcq',
                    num_questions: 10,
                    marks_per_question: 1,
                    negative_marks: 0,
                    difficulty_easy_pct: 50,
                    difficulty_medium_pct: 30,
                    difficulty_hard_pct: 20,
                    internal_choice: false
                }
            ]
        },
        {
            section_name: 'Section B - Short Questions',
            section_type: 'theory',
            instructions: 'Short answer questions. Answer each in 30-50 words.',
            rules: [
                {
                    question_type: 'short_answer',
                    num_questions: 5,
                    marks_per_question: 2,
                    negative_marks: 0,
                    difficulty_easy_pct: 30,
                    difficulty_medium_pct: 50,
                    difficulty_hard_pct: 20,
                    internal_choice: false
                }
            ]
        }
    ]
}

// Initial state for question set form
const initialSetForm = {
    id: '',
    title: '',
    description: '',
    board_id: '',
    class_id: '',
    subject_id: '',
    chapter_id: '',
    board_name: 'Gujarat Board',
    class_name: 'Class 8',
    subject_name: 'English',
    chapter_name: 'Chapter Practice'
}

// Initial state for question form
const initialQuestionForm = {
    id: '',
    type: 'objective',
    sub_type: 'mcq',
    text_en: '',
    text_gu: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    marks: 1,
    negative_marks: 0,
    difficulty: 'medium'
}

const STANDARD_BOARDS = [
    { id: 'cbse', name: 'CBSE (Central Board of Secondary Education)' },
    { id: 'icse', name: 'ICSE / ISC (Council for the Indian School Certificate Examinations)' },
    { id: 'gseb', name: 'Gujarat State Board (GSEB)' },
    { id: 'msbshse', name: 'Maharashtra State Board (MSBSHSE)' },
    { id: 'state_board', name: 'State Board Curriculum' },
    { id: 'cambridge', name: 'Cambridge Assessment International Education (CAIE)' }
]

const STANDARD_CLASSES = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11 - Science', 'Class 11 - Commerce', 'Class 11 - Arts',
    'Class 12 - Science', 'Class 12 - Commerce', 'Class 12 - Arts'
]

const STANDARD_SUBJECTS = [
    'Mathematics', 'Science', 'English', 'Social Science',
    'Physics', 'Chemistry', 'Biology', 'Computer Science / IT',
    'Economics', 'Accountancy', 'Business Studies', 'History',
    'Political Science', 'Geography', 'Hindi', 'Gujarati'
]

const STANDARD_CHAPTERS: Record<string, string[]> = {
    'mathematics': [
        'Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables',
        'Quadratic Equations', 'Arithmetic Progressions', 'Triangles',
        'Coordinate Geometry', 'Introduction to Trigonometry', 'Some Applications of Trigonometry',
        'Circles', 'Areas Related to Circles', 'Surface Areas and Volumes',
        'Statistics', 'Probability'
    ],
    'science': [
        'Chemical Reactions and Equations', 'Acids, Bases and Salts',
        'Metals and Non-metals', 'Carbon and its Compounds',
        'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce',
        'Heredity and Evolution', 'Light - Reflection and Refraction',
        'The Human Eye and Colourful World', 'Electricity',
        'Magnetic Effects of Electric Current', 'Our Environment'
    ],
    'physics': [
        'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane',
        'Laws of Motion', 'Work, Energy and Power', 'System of Particles & Rotational Motion',
        'Gravitation', 'Mechanical Properties of Solids & Fluids', 'Thermal Properties of Matter',
        'Thermodynamics', 'Kinetic Theory', 'Oscillations and Waves',
        'Electric Charges and Fields', 'Current Electricity', 'Ray Optics & Optical Instruments'
    ],
    'chemistry': [
        'Some Basic Concepts of Chemistry', 'Structure of Atom',
        'Classification of Elements and Periodicity', 'Chemical Bonding and Molecular Structure',
        'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Organic Chemistry - Basics',
        'Hydrocarbons', 'Solutions', 'Electrochemistry', 'Chemical Kinetics',
        'The d & f Block Elements', 'Coordination Compounds', 'Aldehydes, Ketones & Carboxylic Acids'
    ],
    'biology': [
        'The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom',
        'Morphology & Anatomy of Flowering Plants', 'Cell: The Unit of Life',
        'Biomolecules', 'Cell Cycle and Cell Division', 'Photosynthesis in Higher Plants',
        'Respiration in Plants', 'Plant Growth and Development', 'Human Physiology & Circulation',
        'Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health',
        'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution',
        'Biotechnology: Principles and Processes', 'Ecosystem & Environmental Issues'
    ],
    'english': [
        'Reading Comprehension & Textual Inference', 'Formal & Business Letter Writing',
        'Analytical Paragraph & Argumentative Essay', 'Grammar: Tenses, Modals & Subject-Verb Agreement',
        'Reported Speech: Statements, Questions & Requests', 'Prose: First Flight Analytical Study',
        'Poetry: Central Themes, Imagery & Poetic Devices', 'Supplementary Reader Comprehension'
    ],
    'social science': [
        'History: The Rise of Nationalism in Europe', 'History: Nationalism in India',
        'History: The Making of a Global World', 'Geography: Resources and Development',
        'Geography: Forest and Wildlife Resources', 'Geography: Water Resources',
        'Geography: Agriculture', 'Geography: Minerals and Energy Resources',
        'Polity: Power Sharing & Federalism', 'Polity: Gender, Religion and Caste',
        'Polity: Political Parties & Outcomes of Democracy', 'Economics: Development',
        'Economics: Sectors of the Indian Economy', 'Economics: Money and Credit',
        'Economics: Globalization and the Indian Economy'
    ]
}

export default function OfflinePaperManager() {
    // 5 Operational Tabs
    const [activeTab, setActiveTab] = useState<'roster' | 'composer' | 'templates' | 'questions' | 'packaging'>('roster')

    // Data States
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [papers, setPapers] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [questions, setQuestions] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [metrics, setMetrics] = useState({
        totalPapers: 0,
        printedAssets: 0,
        questionPool: '0 Questions',
        archivedCount: 0
    })

    // Dynamic Syllabus & Exam Pattern Context
    const [blueprintContext, setBlueprintContext] = useState<BlueprintContextData | null>(null)
    const [contextLoading, setContextLoading] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState<string>('')
    const [selectedClassId, setSelectedClassId] = useState<string>('')
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState<string>('')

    // Search & Filters for Papers Roster
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL')

    // Modals for Papers & Patterns
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Paper Pattern Create / Edit Modal State
    const [isPatternModalOpen, setIsPatternModalOpen] = useState(false)
    const [patternModalMode, setPatternModalMode] = useState<'create' | 'edit'>('create')
    const [patternForm, setPatternForm] = useState(initialPatternForm)
    const [patternSaving, setPatternSaving] = useState(false)

    // ── QUESTION BANK & QUESTION SETS DYNAMIC STATE ─────────────
    const [questionSets, setQuestionSets] = useState<any[]>([])
    const [activeSetId, setActiveSetId] = useState<string | null>(null)
    const [activeSetData, setActiveSetData] = useState<any | null>(null)
    const [activeSetQuestions, setActiveSetQuestions] = useState<any[]>([])
    const [loadingSetDetails, setLoadingSetDetails] = useState(false)
    const [questionBankLoading, setQuestionBankLoading] = useState(false)
    const [questionBankSyllabus, setQuestionBankSyllabus] = useState<{
        boards: any[];
        classes: any[];
        subjects: any[];
        chapters: any[];
        topics: any[];
    }>({ boards: [], classes: [], subjects: [], chapters: [], topics: [] })

    // Filters for Question Sets
    const [qSetSearchQuery, setQSetSearchQuery] = useState('')
    const [qSetClassFilter, setQSetClassFilter] = useState('ALL')
    const [qSetSubjectFilter, setQSetSubjectFilter] = useState('ALL')

    // Question Set Modal (Create / Edit)
    const [isSetModalOpen, setIsSetModalOpen] = useState(false)
    const [setModalMode, setSetModalMode] = useState<'create' | 'edit'>('create')
    const [setForm, setSetForm] = useState(initialSetForm)
    const [savingSet, setSavingSet] = useState(false)

    // Question Modal (Add / Edit in Set)
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
    const [questionModalMode, setQuestionModalMode] = useState<'create' | 'edit'>('create')
    const [targetSetIdForQuestion, setTargetSetIdForQuestion] = useState('')
    const [questionForm, setQuestionForm] = useState(initialQuestionForm)
    const [questionSaving, setQuestionSaving] = useState(false)

    // ── AI QUESTION GENERATOR STATE ───────────────────────────
    const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false)
    const [isAiGenerating, setIsAiGenerating] = useState(false)
    const [isSavingAiQuestions, setIsSavingAiQuestions] = useState(false)
    const [aiGenProgress, setAiGenProgress] = useState(0)
    const [aiGenStatusText, setAiGenStatusText] = useState('')
    const [customTopicInput, setCustomTopicInput] = useState('')
    const [isCustomNameEdited, setIsCustomNameEdited] = useState(false)

    // Helper to auto-generate Question Set Name: Board — Class Subject (NO chapters or topics)
    const computeAutoSetName = (boardName: string, className: string, subjectName: string) => {
        const b = (boardName || '').trim()
        const c = (className || '').trim()
        const s = (subjectName || '').trim()
        const classSub = c && s ? `${c} ${s}` : (c || s)
        const parts = [b, classSub].filter(Boolean)
        return parts.join(' — ') || 'Question Set'
    }

    const [aiGenForm, setAiGenForm] = useState({
        setName: '',
        set_id: '',
        board_name: '',
        board_id: '',
        class_name: '',
        class_id: '',
        subject_name: '',
        subject_id: '',
        selected_chapters: [] as string[],
        selected_topics: [] as string[],
        topic: '',
        type: 'objective' as 'objective' | 'subjective',
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        count: 5
    })
    const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([])
    const [selectedAiIndices, setSelectedAiIndices] = useState<number[]>([])

    // Available Boards strictly from School's Course Syllabus Module (No hard-coded data)
    const availableBoardsForAi = useMemo(() => {
        const list: Array<{ id: string; name: string }> = []
        if (blueprintContext?.activeBoards?.length) {
            blueprintContext.activeBoards.forEach(b => {
                if (!list.some(existing => existing.id === b.id || existing.name === b.name)) {
                    list.push({ id: b.id, name: b.name })
                }
            })
        }
        if (questionBankSyllabus?.boards?.length) {
            questionBankSyllabus.boards.forEach((b: any) => {
                if (!list.some(existing => existing.id === b.id || existing.name === b.name)) {
                    list.push({ id: b.id, name: b.name })
                }
            })
        }
        return list
    }, [blueprintContext?.activeBoards, questionBankSyllabus?.boards])

    // Available Classes for selected Board
    const availableClassesForAi = useMemo(() => {
        const board = availableBoardsForAi.find(b => b.name === aiGenForm.board_name || b.id === aiGenForm.board_id)
            || availableBoardsForAi[0]
        const boardId = board?.id

        const classList: Array<{ id: string; name: string; board_id?: string }> = []
        if (boardId && blueprintContext?.syllabusTree?.classes?.length) {
            blueprintContext.syllabusTree.classes
                .filter(c => c.board_id === boardId)
                .forEach(c => {
                    if (!classList.some(existing => existing.name === c.name)) {
                        classList.push(c)
                    }
                })
        }
        if (boardId && questionBankSyllabus?.classes?.length) {
            questionBankSyllabus.classes
                .filter((c: any) => c.parent_id === boardId)
                .forEach((c: any) => {
                    if (!classList.some(existing => existing.name === c.name)) {
                        classList.push({ id: c.id, name: c.name, board_id: c.parent_id })
                    }
                })
        }

        if (classList.length === 0) {
            const allTreeClasses = blueprintContext?.syllabusTree?.classes || questionBankSyllabus?.classes || classes
            allTreeClasses.forEach((c: any) => {
                if (!classList.some(existing => existing.name === c.name)) {
                    classList.push(c)
                }
            })
        }

        return classList
    }, [availableBoardsForAi, aiGenForm.board_name, aiGenForm.board_id, blueprintContext, questionBankSyllabus, classes])

    // Available Subjects for selected Class
    const availableSubjectsForAi = useMemo(() => {
        const cls = availableClassesForAi.find(c => c.name === aiGenForm.class_name || c.id === aiGenForm.class_id)
            || availableClassesForAi[0]
        const classId = cls?.id

        const subjectList: Array<{ id: string; name: string; class_node_id?: string }> = []
        if (classId && blueprintContext?.syllabusTree?.subjects?.length) {
            blueprintContext.syllabusTree.subjects
                .filter(s => s.class_node_id === classId)
                .forEach(s => {
                    if (!subjectList.some(existing => existing.name === s.name)) {
                        subjectList.push(s)
                    }
                })
        }
        if (classId && questionBankSyllabus?.subjects?.length) {
            questionBankSyllabus.subjects
                .filter((s: any) => s.parent_id === classId)
                .forEach((s: any) => {
                    if (!subjectList.some(existing => existing.name === s.name)) {
                        subjectList.push({ id: s.id, name: s.name, class_node_id: s.parent_id })
                    }
                })
        }

        if (subjectList.length === 0) {
            const allTreeSubs = blueprintContext?.syllabusTree?.subjects || questionBankSyllabus?.subjects || subjects
            allTreeSubs.forEach((s: any) => {
                if (!subjectList.some(existing => existing.name === s.name)) {
                    subjectList.push(s)
                }
            })
        }

        return subjectList
    }, [availableClassesForAi, aiGenForm.class_name, aiGenForm.class_id, blueprintContext, questionBankSyllabus, subjects])

    // Available Chapters for selected Subject
    const availableChaptersForAi = useMemo(() => {
        const sub = availableSubjectsForAi.find(s => s.name === aiGenForm.subject_name || s.id === aiGenForm.subject_id)
            || availableSubjectsForAi[0]
        const subId = sub?.id

        const chapterList: Array<{ id: string; name: string; subject_node_id?: string }> = []
        if (subId && blueprintContext?.syllabusTree?.chapters?.length) {
            blueprintContext.syllabusTree.chapters
                .filter(ch => ch.subject_node_id === subId)
                .forEach(ch => {
                    if (!chapterList.some(existing => existing.name === ch.name)) {
                        chapterList.push(ch)
                    }
                })
        }
        if (subId && questionBankSyllabus?.chapters?.length) {
            questionBankSyllabus.chapters
                .filter((ch: any) => ch.parent_id === subId)
                .forEach((ch: any) => {
                    if (!chapterList.some(existing => existing.name === ch.name)) {
                        chapterList.push({ id: ch.id, name: ch.name, subject_node_id: ch.parent_id })
                    }
                })
        }

        return chapterList
    }, [availableSubjectsForAi, aiGenForm.subject_name, aiGenForm.subject_id, blueprintContext, questionBankSyllabus])

    // Available Topics for selected Chapters / Subject
    const availableTopicsForAi = useMemo(() => {
        const allChapterIds = availableChaptersForAi.map(c => c.id)
        const selectedChapterNodes = availableChaptersForAi.filter(c => aiGenForm.selected_chapters.includes(c.name))
        const activeChapterIds = selectedChapterNodes.length > 0
            ? selectedChapterNodes.map(c => c.id)
            : allChapterIds

        const topicList: Array<{ id: string; name: string; chapter_node_id?: string; chapter_name?: string }> = []
        if (activeChapterIds.length > 0 && blueprintContext?.syllabusTree?.topics?.length) {
            blueprintContext.syllabusTree.topics
                .filter(tp => activeChapterIds.includes(tp.chapter_node_id))
                .forEach(tp => {
                    const parentChapter = availableChaptersForAi.find(c => c.id === tp.chapter_node_id)
                    if (!topicList.some(existing => existing.name === tp.name)) {
                        topicList.push({ ...tp, chapter_name: parentChapter?.name })
                    }
                })
        }
        if (activeChapterIds.length > 0 && questionBankSyllabus?.topics?.length) {
            questionBankSyllabus.topics
                .filter((tp: any) => activeChapterIds.includes(tp.parent_id))
                .forEach((tp: any) => {
                    const parentChapter = availableChaptersForAi.find(c => c.id === tp.parent_id)
                    if (!topicList.some(existing => existing.name === tp.name)) {
                        topicList.push({ id: tp.id, name: tp.name, chapter_node_id: tp.parent_id, chapter_name: parentChapter?.name })
                    }
                })
        }

        return topicList
    }, [availableChaptersForAi, aiGenForm.selected_chapters, blueprintContext, questionBankSyllabus])

    // Composer Form State
    const [composerForm, setComposerForm] = useState({
        title: '',
        class_id: '',
        subject_id: '',
        template_id: '',
        chapter_ids: [] as string[],
        marks: 80,
        duration: 180,
        total_questions: 25,
        bilingual: true
    })

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // Fetch Blueprint Context
    const fetchBlueprintContext = useCallback(async () => {
        setContextLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/blueprint-context')
            if (res.ok) {
                const data: BlueprintContextData = await res.json()
                setBlueprintContext(data)
                if (data.activeBoards?.length > 0 && !selectedBoardId) {
                    setSelectedBoardId(data.activeBoards[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to load blueprint context in Offline Exams:', err)
        } finally {
            setContextLoading(false)
        }
    }, [selectedBoardId])

    useEffect(() => {
        fetchBlueprintContext()
    }, [fetchBlueprintContext])

    // Fetch Question Sets & Question Bank Data
    const fetchQuestionSets = useCallback(async () => {
        setQuestionBankLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/question-bank')
            if (res.ok) {
                const data = await res.json()
                setQuestionSets(data.sets || [])
                if (data.syllabus) {
                    setQuestionBankSyllabus(data.syllabus)
                }
            }
        } catch (err) {
            console.error('Failed to fetch question sets:', err)
        } finally {
            setQuestionBankLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchQuestionSets()
    }, [fetchQuestionSets])

    // Fetch Specific Question Set Details & Its Questions
    const fetchSetQuestions = useCallback(async (setId: string) => {
        setLoadingSetDetails(true)
        try {
            const res = await fetch(`/api/dashboard/exams/question-bank?setId=${setId}`)
            if (res.ok) {
                const data = await res.json()
                setActiveSetData(data.set)
                setActiveSetQuestions(data.questions || [])
            } else {
                showToast('Failed to load questions for this set', false)
            }
        } catch (err) {
            console.error('Failed to fetch set questions:', err)
        } finally {
            setLoadingSetDetails(false)
        }
    }, [])

    // Fetch All Dynamic Records
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/offline')
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || 'Failed to load offline examination data')
            }
            const data = await res.json()

            setPapers(data.exams || [])
            setTemplates(data.templates || [])
            setQuestions(data.questions || [])
            setClasses(data.classes || [])
            setSubjects(data.subjects || [])
            setMetrics(data.metrics || {
                totalPapers: (data.exams || []).length,
                printedAssets: 0,
                questionPool: `${(data.questions || []).length} Questions`,
                archivedCount: 0
            })

            if (data.classes?.length > 0) {
                setComposerForm(prev => prev.class_id ? prev : ({
                    ...prev,
                    class_id: data.classes[0].id,
                    subject_id: data.subjects?.[0]?.id || '',
                    template_id: data.templates?.[0]?.id || ''
                }))
            }
        } catch (e: any) {
            console.error('Fetch error:', e)
            showToast(e.message || 'Error fetching records', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Unified Display Patterns
    const displayPatterns = useMemo(() => {
        if (blueprintContext?.patterns && (blueprintContext.patterns as any[]).length > 0) {
            return blueprintContext.patterns as any[]
        }
        if (blueprintContext?.examPatterns && blueprintContext.examPatterns.length > 0) {
            return blueprintContext.examPatterns as any[]
        }
        return templates
    }, [blueprintContext?.patterns, blueprintContext?.examPatterns, templates])

    // Filtered Papers (Strictly Offline Descriptive Papers - No OMR or Online Exams)
    const filteredPapers = useMemo(() => {
        return papers.filter(p => {
            // Strictly exclude OMR exams from the Offline Paper module
            if (p.omr_template_id) return false
            if (p.title?.toLowerCase().includes('omr')) return false

            const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.classes?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesClass = selectedClassFilter === 'ALL' || p.class_id === selectedClassFilter
            const matchesSubject = selectedSubjectFilter === 'ALL' || p.subject_id === selectedSubjectFilter
            return matchesSearch && matchesClass && matchesSubject
        })
    }, [papers, searchQuery, selectedClassFilter, selectedSubjectFilter])

    // Filtered Question Sets (Class, Subject, Search)
    const filteredQuestionSets = useMemo(() => {
        return questionSets.filter(qs => {
            const matchesSearch = qs.title?.toLowerCase().includes(qSetSearchQuery.toLowerCase()) ||
                qs.chapter_name?.toLowerCase().includes(qSetSearchQuery.toLowerCase()) ||
                qs.subject_name?.toLowerCase().includes(qSetSearchQuery.toLowerCase()) ||
                qs.class_name?.toLowerCase().includes(qSetSearchQuery.toLowerCase())
            const matchesClass = qSetClassFilter === 'ALL' || qs.class_name === qSetClassFilter || qs.class_id === qSetClassFilter
            const matchesSubject = qSetSubjectFilter === 'ALL' || qs.subject_name === qSetSubjectFilter || qs.subject_id === qSetSubjectFilter
            return matchesSearch && matchesClass && matchesSubject
        })
    }, [questionSets, qSetSearchQuery, qSetClassFilter, qSetSubjectFilter])

    // Total questions counted across all question sets
    const totalQuestionsInSets = useMemo(() => {
        return questionSets.reduce((sum, s) => sum + (Number(s.total_questions) || 0), 0)
    }, [questionSets])

    // Create New Offline Exam Paper
    const handleCreatePaper = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!composerForm.title.trim()) {
            showToast('Please enter an exam paper title', false)
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_EXAM',
                    payload: composerForm
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create offline paper')

            showToast('Examination Paper generated successfully!', true)
            setIsCreateModalOpen(false)
            setComposerForm(prev => ({ ...prev, title: '' }))
            fetchData()
            setActiveTab('roster')
        } catch (err: any) {
            showToast(err.message || 'Error creating paper', false)
        } finally {
            setSaving(false)
        }
    }

    // Duplicate Paper (Set A -> Set B)
    const handleDuplicatePaper = async (id: string, title: string) => {
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DUPLICATE_EXAM',
                    payload: { id }
                })
            })
            if (!res.ok) throw new Error('Failed to duplicate paper')
            showToast(`Created duplicate: "${title} (Set B)"`, true)
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error duplicating paper', false)
        }
    }

    // Delete Paper
    const handleDeletePaper = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return
        try {
            const res = await fetch('/api/dashboard/exams/offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_EXAM',
                    payload: { id }
                })
            })
            if (!res.ok) throw new Error('Failed to delete paper')
            showToast('Examination paper deleted', true)
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error deleting paper', false)
        }
    }

    // Open Create Pattern Modal
    const handleOpenCreatePattern = () => {
        setPatternModalMode('create')
        setPatternForm(initialPatternForm)
        setIsPatternModalOpen(true)
    }

    // Open Edit Pattern Modal
    const handleOpenEditPattern = (pattern: any) => {
        const isOwner = Boolean(pattern.is_owner_pattern)
        setPatternModalMode('edit')
        setPatternForm({
            id: pattern.id,
            name: isOwner ? `${pattern.name} (School Custom)` : pattern.name,
            description: pattern.description || '',
            category: pattern.category || 'Board Standard',
            exam_type: pattern.exam_type || 'descriptive',
            total_marks: pattern.total_marks || 80,
            duration_minutes: pattern.duration_minutes || 180,
            instructions: typeof pattern.instructions === 'string' ? pattern.instructions : 'All questions are compulsory.',
            is_owner_pattern: isOwner,
            sections: (pattern.sections && pattern.sections.length > 0)
                ? pattern.sections.map((s: any) => ({
                    section_name: s.section_name || s.name || 'Section A',
                    section_type: s.section_type || 'theory',
                    instructions: s.instructions || '',
                    rules: (s.rules && s.rules.length > 0)
                        ? s.rules.map((r: any) => ({
                            question_type: r.question_type || 'mcq',
                            num_questions: r.num_questions || 5,
                            marks_per_question: r.marks_per_question || 1,
                            negative_marks: r.negative_marks || 0,
                            difficulty_easy_pct: r.difficulty_easy_pct || 40,
                            difficulty_medium_pct: r.difficulty_medium_pct || 40,
                            difficulty_hard_pct: r.difficulty_hard_pct || 20,
                            internal_choice: Boolean(r.internal_choice)
                        }))
                        : [
                            {
                                question_type: 'mcq',
                                num_questions: 5,
                                marks_per_question: 1,
                                negative_marks: 0,
                                difficulty_easy_pct: 40,
                                difficulty_medium_pct: 40,
                                difficulty_hard_pct: 20,
                                internal_choice: false
                            }
                        ]
                }))
                : initialPatternForm.sections
        })
        setIsPatternModalOpen(true)
    }

    // Save Paper Pattern
    const handleSavePattern = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!patternForm.name.trim()) {
            showToast('Please enter a pattern name', false)
            return
        }

        setPatternSaving(true)
        try {
            const isEditExistingCustom = patternModalMode === 'edit' && !patternForm.is_owner_pattern && patternForm.id
            const action = isEditExistingCustom ? 'UPDATE_PAPER_PATTERN' : 'CREATE_PAPER_PATTERN'

            const payload: any = {
                name: patternForm.name.trim(),
                description: patternForm.description.trim(),
                category: patternForm.category,
                exam_type: patternForm.exam_type,
                total_marks: Number(patternForm.total_marks) || 80,
                duration_minutes: Number(patternForm.duration_minutes) || 180,
                instructions: patternForm.instructions,
                sections: patternForm.sections
            }
            if (isEditExistingCustom) {
                payload.id = patternForm.id
            }

            const res = await fetch('/api/dashboard/exams/blueprint-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save paper pattern')

            showToast(isEditExistingCustom ? 'Paper pattern updated successfully!' : 'New paper pattern created successfully!', true)
            setIsPatternModalOpen(false)
            fetchBlueprintContext()
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error saving paper pattern', false)
        } finally {
            setPatternSaving(false)
        }
    }

    // Delete Paper Pattern
    const handleDeletePattern = async (pattern: any) => {
        if (pattern.is_owner_pattern) {
            showToast('Official board patterns are provided by the system and cannot be deleted.', false)
            return
        }

        if (!confirm(`Are you sure you want to delete the pattern "${pattern.name}"?`)) return

        try {
            const res = await fetch('/api/dashboard/exams/blueprint-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_PAPER_PATTERN',
                    payload: { id: pattern.id }
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete paper pattern')

            showToast('Paper pattern deleted successfully', true)
            fetchBlueprintContext()
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error deleting paper pattern', false)
        }
    }

    // Helper: Add section to patternForm
    const handleAddSection = () => {
        const nextChar = String.fromCharCode(65 + patternForm.sections.length)
        setPatternForm(prev => ({
            ...prev,
            sections: [
                ...prev.sections,
                {
                    section_name: `Section ${nextChar}`,
                    section_type: 'theory',
                    instructions: 'Answer all questions in this section.',
                    rules: [
                        {
                            question_type: 'short_answer',
                            num_questions: 5,
                            marks_per_question: 2,
                            negative_marks: 0,
                            difficulty_easy_pct: 40,
                            difficulty_medium_pct: 40,
                            difficulty_hard_pct: 20,
                            internal_choice: false
                        }
                    ]
                }
            ]
        }))
    }

    // Helper: Remove section from patternForm
    const handleRemoveSection = (index: number) => {
        if (patternForm.sections.length <= 1) {
            showToast('Pattern must have at least one section', false)
            return
        }
        setPatternForm(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index)
        }))
    }

    // Helper: Add rule to a section
    const handleAddRuleToSection = (sectionIndex: number) => {
        setPatternForm(prev => {
            const newSections = [...prev.sections]
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                rules: [
                    ...newSections[sectionIndex].rules,
                    {
                        question_type: 'short_answer',
                        num_questions: 3,
                        marks_per_question: 2,
                        negative_marks: 0,
                        difficulty_easy_pct: 40,
                        difficulty_medium_pct: 40,
                        difficulty_hard_pct: 20,
                        internal_choice: false
                    }
                ]
            }
            return { ...prev, sections: newSections }
        })
    }

    // Helper: Remove rule from a section
    const handleRemoveRuleFromSection = (sectionIndex: number, ruleIndex: number) => {
        setPatternForm(prev => {
            const newSections = [...prev.sections]
            if (newSections[sectionIndex].rules.length <= 1) {
                showToast('Each section must have at least one question rule', false)
                return prev
            }
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                rules: newSections[sectionIndex].rules.filter((_, i) => i !== ruleIndex)
            }
            return { ...prev, sections: newSections }
        })
    }

    // ── QUESTION SET HANDLERS ─────────────────────────────────
    const handleOpenCreateSet = () => {
        setSetModalMode('create')
        setSetForm(initialSetForm)
        setIsSetModalOpen(true)
    }

    const handleOpenEditSet = (set: any) => {
        setSetModalMode('edit')
        setSetForm({
            id: set.id,
            title: set.title || '',
            description: set.description || '',
            board_id: set.board_id || '',
            class_id: set.class_id || '',
            subject_id: set.subject_id || '',
            chapter_id: set.chapter_id || '',
            board_name: set.board_name || '',
            class_name: set.class_name || '',
            subject_name: set.subject_name || '',
            chapter_name: set.chapter_name || ''
        })
        setIsSetModalOpen(true)
    }

    const handleSaveSet = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!setForm.title.trim()) {
            showToast('Please enter a question set title', false)
            return
        }

        setSavingSet(true)
        try {
            const action = setModalMode === 'create' ? 'CREATE_SET' : 'UPDATE_SET'
            const res = await fetch('/api/dashboard/exams/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload: setForm })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save question set')

            showToast(setModalMode === 'create' ? 'Question set created successfully!' : 'Question set updated!', true)
            setIsSetModalOpen(false)
            fetchQuestionSets()
            if (activeSetId && activeSetId === setForm.id) {
                fetchSetQuestions(setForm.id)
            }
        } catch (err: any) {
            showToast(err.message || 'Error saving question set', false)
        } finally {
            setSavingSet(false)
        }
    }

    const handleDeleteSet = async (setId: string, setTitle: string) => {
        if (!confirm(`Are you sure you want to delete the question set "${setTitle}" and all questions inside it? This cannot be undone.`)) {
            return
        }

        try {
            const res = await fetch('/api/dashboard/exams/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_SET',
                    payload: { id: setId }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete question set')

            showToast('Question set deleted successfully', true)
            if (activeSetId === setId) {
                setActiveSetId(null)
                setActiveSetData(null)
                setActiveSetQuestions([])
            }
            fetchQuestionSets()
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error deleting question set', false)
        }
    }

    // ── QUESTION CRUD HANDLERS ────────────────────────────────
    const handleOpenAddQuestion = (setId: string) => {
        setTargetSetIdForQuestion(setId)
        setQuestionModalMode('create')
        setQuestionForm(initialQuestionForm)
        setIsQuestionModalOpen(true)
    }

    const handleOpenEditQuestion = (q: any) => {
        setQuestionModalMode('edit')
        setTargetSetIdForQuestion(activeSetId || q.set_id || '')
        setQuestionForm({
            id: q.id,
            type: q.type || 'objective',
            sub_type: q.sub_type || 'mcq',
            text_en: q.text_en || (typeof q.question_text === 'object' ? q.question_text?.en : q.question_text) || '',
            text_gu: q.text_gu || (typeof q.question_text === 'object' ? q.question_text?.gu : '') || '',
            options: Array.isArray(q.options) && q.options.length >= 4 ? q.options : (q.options || ['', '', '', '']),
            correct_answer: q.correct_answer || 'A',
            explanation: q.explanation || '',
            marks: Number(q.marks) || 1,
            negative_marks: Number(q.negative_marks) || 0,
            difficulty: q.difficulty || 'medium'
        })
        setIsQuestionModalOpen(true)
    }

    const handleSaveQuestion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!questionForm.text_en.trim()) {
            showToast('Please enter the question text', false)
            return
        }

        setQuestionSaving(true)
        try {
            const action = questionModalMode === 'create' ? 'ADD_QUESTION' : 'UPDATE_QUESTION'
            const payload = {
                ...questionForm,
                set_id: targetSetIdForQuestion
            }

            const res = await fetch('/api/dashboard/exams/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save question')

            showToast(questionModalMode === 'create' ? 'Question added to set successfully!' : 'Question updated!', true)
            setIsQuestionModalOpen(false)
            if (activeSetId) {
                fetchSetQuestions(activeSetId)
            }
            fetchQuestionSets()
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error saving question', false)
        } finally {
            setQuestionSaving(false)
        }
    }

    const handleDeleteQuestion = async (qId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return

        try {
            const res = await fetch('/api/dashboard/exams/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_QUESTION',
                    payload: { id: qId }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete question')

            showToast('Question deleted successfully', true)
            if (activeSetId) {
                fetchSetQuestions(activeSetId)
            }
            fetchQuestionSets()
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error deleting question', false)
        }
    }

    // ── AI QUESTION GENERATION HANDLERS ───────────────────────
    const handleOpenAiGen = (setId?: string) => {
        const targetId = setId || activeSetId || ''
        const targetSet = targetId ? (questionSets.find(s => s.id === targetId) || activeSetData) : null

        // 1. Resolve Board strictly from school's syllabus (default to first active board from syllabus)
        const targetBoardObj = availableBoardsForAi.find(b => b.name === targetSet?.board_name || b.id === targetSet?.board_id)
            || availableBoardsForAi[0]
            || { id: '', name: 'Gujarat Board (English Medium)' }

        const targetBoard = targetSet?.board_name || targetBoardObj.name
        const targetBoardId = targetSet?.board_id || targetBoardObj.id

        // 2. Resolve Class for this board
        let classesForBoard: any[] = []
        if (targetBoardId && blueprintContext?.syllabusTree?.classes) {
            classesForBoard = blueprintContext.syllabusTree.classes.filter(c => c.board_id === targetBoardId)
        }
        if (classesForBoard.length === 0 && questionBankSyllabus?.classes) {
            classesForBoard = questionBankSyllabus.classes.filter((c: any) => c.parent_id === targetBoardId)
        }
        const targetClassObj = classesForBoard.find((c: any) => c.name === targetSet?.class_name || c.id === targetSet?.class_id)
            || classesForBoard[0]
            || classes[0]
            || { id: '', name: 'Class 1' }

        const targetClass = targetSet?.class_name || targetClassObj.name
        const targetClassId = targetSet?.class_id || targetClassObj.id

        // 3. Resolve Subject for this class
        let subjectsForClass: any[] = []
        if (targetClassId && blueprintContext?.syllabusTree?.subjects) {
            subjectsForClass = blueprintContext.syllabusTree.subjects.filter(s => s.class_node_id === targetClassId)
        }
        if (subjectsForClass.length === 0 && questionBankSyllabus?.subjects) {
            subjectsForClass = questionBankSyllabus.subjects.filter((s: any) => s.parent_id === targetClassId)
        }
        const targetSubjectObj = subjectsForClass.find((s: any) => s.name === targetSet?.subject_name || s.id === targetSet?.subject_id)
            || subjectsForClass[0]
            || subjects[0]
            || { id: '', name: 'English' }

        const targetSubject = targetSet?.subject_name || targetSubjectObj.name
        const targetSubjectId = targetSet?.subject_id || targetSubjectObj.id

        // 4. Resolve Chapters for this subject
        let chaptersForSubject: any[] = []
        if (targetSubjectId && blueprintContext?.syllabusTree?.chapters) {
            chaptersForSubject = blueprintContext.syllabusTree.chapters.filter(ch => ch.subject_node_id === targetSubjectId)
        }
        if (chaptersForSubject.length === 0 && questionBankSyllabus?.chapters) {
            chaptersForSubject = questionBankSyllabus.chapters.filter((ch: any) => ch.parent_id === targetSubjectId)
        }

        const initialChapters = targetSet?.chapter_name 
            ? targetSet.chapter_name.split(',').map((c: string) => c.trim()).filter(Boolean)
            : (chaptersForSubject.length > 0 ? [chaptersForSubject[0].name] : [])

        // 5. Compute Question Set Name: Board + Class + Subject (NO chapters or topics)
        const initialName = targetSet?.title || computeAutoSetName(targetBoard, targetClass, targetSubject)

        setAiGenForm({
            setName: initialName,
            set_id: targetSet?.id || '',
            board_name: targetBoard,
            board_id: targetBoardId,
            class_name: targetClass,
            class_id: targetClassId,
            subject_name: targetSubject,
            subject_id: targetSubjectId,
            selected_chapters: initialChapters,
            selected_topics: [] as string[],
            topic: '',
            type: 'objective',
            difficulty: 'medium',
            count: 5
        })
        setIsCustomNameEdited(Boolean(targetSet?.title))
        setCustomTopicInput('')
        setAiGenProgress(0)
        setAiGenStatusText('')
        setAiGeneratedQuestions([])
        setSelectedAiIndices([])
        setIsAiGenModalOpen(true)
    }

    const handleBoardChange = (newBoardName: string) => {
        const targetBoardObj = availableBoardsForAi.find(b => b.name === newBoardName)
            || availableBoardsForAi[0]
            || { id: '', name: newBoardName }
        const boardId = targetBoardObj.id

        // Resolve classes for this board
        let classesForBoard: any[] = []
        if (boardId && blueprintContext?.syllabusTree?.classes) {
            classesForBoard = blueprintContext.syllabusTree.classes.filter(c => c.board_id === boardId)
        }
        if (classesForBoard.length === 0 && questionBankSyllabus?.classes) {
            classesForBoard = questionBankSyllabus.classes.filter((c: any) => c.parent_id === boardId)
        }
        const firstClass = classesForBoard[0] || classes[0] || { id: '', name: 'Class 1' }

        // Resolve subjects for firstClass
        let subjectsForClass: any[] = []
        if (firstClass.id && blueprintContext?.syllabusTree?.subjects) {
            subjectsForClass = blueprintContext.syllabusTree.subjects.filter(s => s.class_node_id === firstClass.id)
        }
        if (subjectsForClass.length === 0 && questionBankSyllabus?.subjects) {
            subjectsForClass = questionBankSyllabus.subjects.filter((s: any) => s.parent_id === firstClass.id)
        }
        const firstSubject = subjectsForClass[0] || subjects[0] || { id: '', name: 'English' }

        // Resolve chapters for firstSubject
        let chaptersForSubject: any[] = []
        if (firstSubject.id && blueprintContext?.syllabusTree?.chapters) {
            chaptersForSubject = blueprintContext.syllabusTree.chapters.filter(ch => ch.subject_node_id === firstSubject.id)
        }
        if (chaptersForSubject.length === 0 && questionBankSyllabus?.chapters) {
            chaptersForSubject = questionBankSyllabus.chapters.filter((ch: any) => ch.parent_id === firstSubject.id)
        }
        const initialChapters = chaptersForSubject.length > 0 ? [chaptersForSubject[0].name] : []

        setAiGenForm(prev => {
            const nextName = isCustomNameEdited ? prev.setName : computeAutoSetName(newBoardName, firstClass.name, firstSubject.name)
            return {
                ...prev,
                board_name: newBoardName,
                board_id: boardId,
                class_name: firstClass.name,
                class_id: firstClass.id,
                subject_name: firstSubject.name,
                subject_id: firstSubject.id,
                selected_chapters: initialChapters,
                selected_topics: [],
                setName: nextName
            }
        })
    }

    const handleClassChange = (newClassName: string) => {
        const targetClassObj = availableClassesForAi.find(c => c.name === newClassName)
            || availableClassesForAi[0]
            || { id: '', name: newClassName }
        const classId = targetClassObj.id

        // Resolve subjects for this class
        let subjectsForClass: any[] = []
        if (classId && blueprintContext?.syllabusTree?.subjects) {
            subjectsForClass = blueprintContext.syllabusTree.subjects.filter(s => s.class_node_id === classId)
        }
        if (subjectsForClass.length === 0 && questionBankSyllabus?.subjects) {
            subjectsForClass = questionBankSyllabus.subjects.filter((s: any) => s.parent_id === classId)
        }
        const firstSubject = subjectsForClass[0] || subjects[0] || { id: '', name: 'English' }

        // Resolve chapters for firstSubject
        let chaptersForSubject: any[] = []
        if (firstSubject.id && blueprintContext?.syllabusTree?.chapters) {
            chaptersForSubject = blueprintContext.syllabusTree.chapters.filter(ch => ch.subject_node_id === firstSubject.id)
        }
        if (chaptersForSubject.length === 0 && questionBankSyllabus?.chapters) {
            chaptersForSubject = questionBankSyllabus.chapters.filter((ch: any) => ch.parent_id === firstSubject.id)
        }
        const initialChapters = chaptersForSubject.length > 0 ? [chaptersForSubject[0].name] : []

        setAiGenForm(prev => {
            const nextName = isCustomNameEdited ? prev.setName : computeAutoSetName(prev.board_name, newClassName, firstSubject.name)
            return {
                ...prev,
                class_name: newClassName,
                class_id: classId,
                subject_name: firstSubject.name,
                subject_id: firstSubject.id,
                selected_chapters: initialChapters,
                selected_topics: [],
                setName: nextName
            }
        })
    }

    const handleSubjectChange = (newSubjectName: string) => {
        const targetSubjectObj = availableSubjectsForAi.find(s => s.name === newSubjectName)
            || availableSubjectsForAi[0]
            || { id: '', name: newSubjectName }
        const subjectId = targetSubjectObj.id

        // Resolve chapters for this subject
        let chaptersForSubject: any[] = []
        if (subjectId && blueprintContext?.syllabusTree?.chapters) {
            chaptersForSubject = blueprintContext.syllabusTree.chapters.filter(ch => ch.subject_node_id === subjectId)
        }
        if (chaptersForSubject.length === 0 && questionBankSyllabus?.chapters) {
            chaptersForSubject = questionBankSyllabus.chapters.filter((ch: any) => ch.parent_id === subjectId)
        }
        const initialChapters = chaptersForSubject.length > 0 ? [chaptersForSubject[0].name] : []

        setAiGenForm(prev => {
            const nextName = isCustomNameEdited ? prev.setName : computeAutoSetName(prev.board_name, prev.class_name, newSubjectName)
            return {
                ...prev,
                subject_name: newSubjectName,
                subject_id: subjectId,
                selected_chapters: initialChapters,
                selected_topics: [],
                setName: nextName
            }
        })
    }

    const handleRunAiGeneration = async () => {
        const targetSetName = aiGenForm.setName?.trim()
        if (!targetSetName) {
            showToast('Please enter a Question Set Name', false)
            return
        }
        if (!aiGenForm.class_name || !aiGenForm.subject_name) {
            showToast('Please specify target class and subject', false)
            return
        }
        if (aiGenForm.selected_chapters.length === 0 && aiGenForm.selected_topics.length === 0 && !aiGenForm.topic?.trim()) {
            showToast('Please select at least one chapter or topic', false)
            return
        }

        setIsAiGenerating(true)
        setAiGenProgress(12)
        setAiGenStatusText('Connecting to AI Curriculum Engine...')

        let currentProgress = 12
        const progressTimer = setInterval(() => {
            currentProgress = Math.min(currentProgress + Math.floor(Math.random() * 8) + 4, 94)
            setAiGenProgress(currentProgress)

            if (currentProgress < 35) {
                setAiGenStatusText(`Analyzing ${aiGenForm.board_name} standards for ${aiGenForm.class_name}...`)
            } else if (currentProgress < 65) {
                setAiGenStatusText(`Synthesizing questions for ${aiGenForm.subject_name} (${aiGenForm.selected_chapters.slice(0, 2).join(', ')})...`)
            } else if (currentProgress < 85) {
                setAiGenStatusText('Formulating distractor options, marking schemes, and answer keys...')
            } else {
                setAiGenStatusText('Validating curriculum accuracy and formatting question bank...')
            }
        }, 400)

        try {
            const chapterFocus = aiGenForm.selected_chapters.map(c => `Chapter: ${c}`)
            const topicFocus = aiGenForm.selected_topics.map(t => `Topic: ${t}`)
            const customFocus = aiGenForm.topic?.trim() ? [`Focus: ${aiGenForm.topic.trim()}`] : []
            const combinedTopics = [...chapterFocus, ...topicFocus, ...customFocus].join(', ') || 'Core Syllabus Practice'

            const res = await fetch('/api/dashboard/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_QUESTIONS',
                    syllabus_name: aiGenForm.board_name,
                    class_name: aiGenForm.class_name,
                    subject_name: aiGenForm.subject_name,
                    chapters: aiGenForm.selected_chapters,
                    topics: aiGenForm.selected_topics,
                    topic: combinedTopics,
                    question_type: aiGenForm.type,
                    difficulty: aiGenForm.difficulty,
                    count: aiGenForm.count,
                    include_answers: true
                })
            })
            const data = await res.json()
            if (!res.ok || !data.questions) {
                throw new Error(data.error || 'Failed to generate questions with AI')
            }

            clearInterval(progressTimer)
            setAiGenProgress(100)
            setAiGenStatusText('Questions generated successfully!')

            // Format questions so they are ready for inline editing
            const formatted = data.questions.map((q: any, idx: number) => {
                const text = q.text || q.question_text || ''
                let opts = q.options
                if (typeof opts === 'string') {
                    try { opts = JSON.parse(opts) } catch (e) { opts = [] }
                }
                if (aiGenForm.type === 'objective' && (!Array.isArray(opts) || opts.length === 0)) {
                    opts = ['Option A', 'Option B', 'Option C', 'Option D']
                }

                const randomSalt = Math.random().toString(36).substring(2, 7)
                const safeId = (q.id && !q.id.endsWith('_1') && q.id !== 'gen_section_a_1')
                    ? `${q.id}_${idx + 1}_${randomSalt}`
                    : `gen_q_${Date.now()}_${idx + 1}_${randomSalt}`

                return {
                    id: safeId,
                    question_text: text,
                    text: text,
                    type: q.type || aiGenForm.type,
                    sub_type: q.sub_type || (aiGenForm.type === 'subjective' ? 'descriptive' : 'mcq'),
                    options: Array.isArray(opts) ? opts : (aiGenForm.type === 'objective' ? ['', '', '', ''] : null),
                    correct_answer: q.correct_answer || (aiGenForm.type === 'objective' ? 'A' : ''),
                    explanation: q.explanation || '',
                    marks: Number(q.marks) || (aiGenForm.type === 'subjective' ? 3 : 1),
                    difficulty: q.difficulty || aiGenForm.difficulty
                }
            })

            setTimeout(() => {
                setAiGeneratedQuestions(formatted)
                setSelectedAiIndices(formatted.map((_: any, idx: number) => idx))
                setIsAiGenerating(false)
                showToast(`Generated ${formatted.length} questions! You can now inline edit, delete, or add questions.`, true)
            }, 500)
        } catch (err: any) {
            clearInterval(progressTimer)
            setIsAiGenerating(false)
            showToast(err.message || 'Error running AI generation', false)
        }
    }

    const handleUpdateQuestionField = (index: number, field: string, value: any) => {
        setAiGeneratedQuestions(prev => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: value }
            return next
        })
    }

    const handleUpdateQuestionOption = (qIdx: number, optIdx: number, value: string) => {
        setAiGeneratedQuestions(prev => {
            const next = [...prev]
            const currOpts = Array.isArray(next[qIdx].options) ? [...next[qIdx].options] : ['', '', '', '']
            currOpts[optIdx] = value
            next[qIdx] = { ...next[qIdx], options: currOpts }
            return next
        })
    }

    const handleDeleteAiQuestion = (index: number) => {
        setAiGeneratedQuestions(prev => prev.filter((_, idx) => idx !== index))
        setSelectedAiIndices(prev => prev.filter(idx => idx !== index).map(idx => idx > index ? idx - 1 : idx))
        showToast('Question removed from batch', true)
    }

    const handleAddManualQuestion = () => {
        const newQ = {
            id: `manual_${Date.now()}`,
            question_text: '',
            text: '',
            type: aiGenForm.type,
            sub_type: aiGenForm.type === 'subjective' ? 'descriptive' : 'mcq',
            options: aiGenForm.type === 'objective' ? ['', '', '', ''] : null,
            correct_answer: aiGenForm.type === 'objective' ? 'A' : '',
            explanation: '',
            marks: aiGenForm.type === 'subjective' ? 3 : 1,
            difficulty: aiGenForm.difficulty
        }
        setAiGeneratedQuestions(prev => [...prev, newQ])
        setSelectedAiIndices(prev => [...prev, prev.length])
        showToast('New blank question added. You can now edit it inline.', true)
    }

    const handleToggleChapter = (chName: string) => {
        setAiGenForm(prev => {
            const exists = prev.selected_chapters.includes(chName)
            const updated = exists
                ? prev.selected_chapters.filter(c => c !== chName)
                : [...prev.selected_chapters, chName]

            return {
                ...prev,
                selected_chapters: updated
            }
        })
    }

    const handleToggleTopic = (tpName: string) => {
        setAiGenForm(prev => {
            const exists = prev.selected_topics.includes(tpName)
            const updated = exists
                ? prev.selected_topics.filter(t => t !== tpName)
                : [...prev.selected_topics, tpName]

            return {
                ...prev,
                selected_topics: updated
            }
        })
    }

    const handleAddCustomChapter = () => {
        const trimmed = customTopicInput.trim()
        if (!trimmed) return
        if (!aiGenForm.selected_topics.includes(trimmed)) {
            setAiGenForm(prev => ({
                ...prev,
                selected_topics: [...prev.selected_topics, trimmed]
            }))
        }
        setCustomTopicInput('')
    }

    const handleSaveAiGeneratedQuestions = async () => {
        const finalSetName = aiGenForm.setName.trim()
        if (!finalSetName) {
            showToast('Please provide a Question Set Name', false)
            return
        }

        if (aiGeneratedQuestions.length === 0) {
            showToast('No questions available to approve and save', false)
            return
        }

        // Validate that questions have text
        const invalidQ = aiGeneratedQuestions.find(q => !(q.question_text || q.text || '').trim())
        if (invalidQ) {
            showToast('One or more questions have empty question text. Please fill or delete them.', false)
            return
        }

        setIsSavingAiQuestions(true)
        try {
            const formatted = aiGeneratedQuestions.map(q => ({
                type: q.type || aiGenForm.type,
                sub_type: q.sub_type || (aiGenForm.type === 'subjective' ? 'descriptive' : 'mcq'),
                text_en: (q.question_text || q.text || '').trim(),
                text_gu: '',
                options: q.options || [],
                correct_answer: (q.correct_answer || '').trim(),
                explanation: (q.explanation || '').trim(),
                marks: Number(q.marks) || (aiGenForm.type === 'subjective' ? 3 : 1),
                difficulty: (q.difficulty || aiGenForm.difficulty || 'medium').toString().toLowerCase()
            }))

            const allSelectedChsAndTopics = [
                ...aiGenForm.selected_chapters,
                ...aiGenForm.selected_topics
            ].filter(Boolean)

            const res = await fetch('/api/dashboard/exams/question-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'BATCH_ADD_QUESTIONS',
                    payload: {
                        set_id: aiGenForm.set_id || undefined,
                        set_name: finalSetName,
                        board_name: aiGenForm.board_name,
                        board_id: aiGenForm.board_id || undefined,
                        class_name: aiGenForm.class_name,
                        class_id: aiGenForm.class_id || undefined,
                        subject_name: aiGenForm.subject_name,
                        subject_id: aiGenForm.subject_id || undefined,
                        chapter_name: allSelectedChsAndTopics.join(', ') || aiGenForm.topic || 'Curriculum Practice',
                        questions: formatted
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save question set')

            showToast(`Question Set "${data.set_title || finalSetName}" approved & stored with ${data.count || formatted.length} questions!`, true)
            setIsAiGenModalOpen(false)
            setAiGeneratedQuestions([])
            setSelectedAiIndices([])

            // Refresh Question Sets and open the newly saved set
            await fetchQuestionSets()
            if (data.set_id) {
                setActiveSetId(data.set_id)
                fetchSetQuestions(data.set_id)
            }
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error approving and saving question set', false)
        } finally {
            setIsSavingAiQuestions(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-sky-200 border-t-[#004B93] rounded-full animate-spin" />
                    <Printer className="absolute inset-0 m-auto text-[#004B93]" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800 text-lg">Loading Exam Papers...</h3>
                <p className="text-slate-500 text-sm mt-1">Getting school questions, exam patterns, and subjects ready...</p>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-slate-50/60 font-sans pb-24">
            {/* TOAST ALERT */}
            {toast && (
                <div className={`fixed top-6 right-8 z-[10000] flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${
                    toast.ok 
                        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 shadow-emerald-500/10' 
                        : 'bg-rose-50/95 border-rose-300 text-rose-900 shadow-rose-500/10'
                }`}>
                    {toast.ok ? <CheckCircle className="text-emerald-600" size={20} /> : <XCircle className="text-rose-600" size={20} />}
                    <span className="text-sm font-bold tracking-tight">{toast.msg}</span>
                </div>
            )}

            {/* FULL-WIDTH HERO BANNER */}
            <div className="w-full relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/images/dashboard/offline_exam_banner.jpg"
                        alt="Academic Examination Printing Desk"
                        fill
                        priority
                        className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
                </div>

                <div className="w-full px-4 sm:px-8 py-10 sm:py-14 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                                <span className="text-xs font-black tracking-widest text-purple-400 uppercase">
                                    EXAM PAPER PRINTING & DESK
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                School Question Paper Center
                            </h1>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                                Create, customize, and print school examination papers with matching answer keys and answer sheets.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1.5"><Shield size={15} className="text-emerald-400" /> School Watermark & QR Code</span>
                                <span className="flex items-center gap-1.5"><Zap size={15} className="text-amber-400" /> Multiple Sets (A, B, C, D)</span>
                                <span className="flex items-center gap-1.5"><Globe size={15} className="text-sky-400" /> English & Regional Languages</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-600 hover:from-sky-700 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-950/40 border border-sky-300/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <PlusCircle size={18} />
                                <span>Create New Exam Paper</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('packaging')}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-bold text-sm backdrop-blur-md border border-slate-700 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Printer size={18} className="text-purple-400" />
                                <span>Print & Download Center</span>
                            </button>
                            <button
                                onClick={() => {
                                    fetchData()
                                    fetchBlueprintContext()
                                    fetchQuestionSets()
                                }}
                                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
                                title="Refresh data"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="w-full px-4 sm:px-8 -mt-6 relative z-20 space-y-6">

                {/* 4 SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-sky-50 flex items-center justify-center text-[#004B93] border border-sky-100">
                            <FileText size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Exam Papers Created</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalPapers} Papers</div>
                            <div className="text-[11px] font-semibold text-sky-700 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> Ready for Examination
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            <Printer size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Printed Papers</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.printedAssets} Copies</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <ArrowUpRight size={12} /> Ready for Exam Hall
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <Target size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Question Sets</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{questionSets.length} Sets</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <Check size={12} /> {totalQuestionsInSets} Questions Indexed
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <Shield size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Paper Patterns</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{displayPatterns.length} Patterns</div>
                            <div className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                                <BookOpen size={12} /> Board & School Patterns
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5 SIMPLE ENGLISH TABS */}
                <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm flex items-center gap-2 overflow-x-auto">
                    {[
                        { id: 'roster', label: 'All Question Papers', icon: FileText, count: filteredPapers.length },
                        { id: 'composer', label: 'Create Question Paper', icon: Sparkles, badge: 'Smart Builder' },
                        { id: 'templates', label: 'Paper Patterns', icon: Layers, count: displayPatterns.length },
                        { id: 'questions', label: 'Question Bank', icon: Database, count: questionSets.length },
                        { id: 'packaging', label: 'Print & Download Center', icon: Printer }
                    ].map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any)
                                    if (tab.id === 'questions') {
                                        fetchQuestionSets()
                                    }
                                }}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-[#004B93] text-white shadow-md shadow-sky-950/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <Icon size={17} />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                                {tab.badge && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-purple-500 text-white">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* TAB 1: ALL QUESTION PAPERS */}
                {activeTab === 'roster' && (
                    <div className="w-full space-y-4">
                        {/* SEARCH & FILTERS */}
                        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by paper title, class, or subject..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#004B93] focus:border-transparent bg-slate-50/50"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                <select
                                    value={selectedClassFilter}
                                    onChange={e => setSelectedClassFilter(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Classes</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedSubjectFilter}
                                    onChange={e => setSelectedSubjectFilter(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Subjects</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code || 'GEN'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* QUESTION PAPERS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPapers.length === 0 ? (
                                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                                    <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                                    <h3 className="font-bold text-slate-800 text-base">No exam papers found</h3>
                                    <p className="text-xs text-slate-500 mt-1">Click "Create New Exam Paper" to generate a question paper.</p>
                                </div>
                            ) : (
                                filteredPapers.map(p => (
                                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all group">
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#004B93] group-hover:scale-110 transition-transform">
                                                    <FileText size={22} />
                                                </div>
                                                <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                    ID: {p.id.split('-')[0].toUpperCase()}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-[#004B93] transition-colors line-clamp-2">
                                                    {p.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                                                    <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                                        {p.classes?.name || 'Class 10'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{p.subjects?.name || 'Mathematics'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Target size={14} className="text-emerald-600" />
                                                    <span><strong>{p.total_questions ? p.total_questions * 2 : 80}</strong> Marks</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Clock size={14} className="text-amber-600" />
                                                    <span><strong>{p.duration || 180}</strong> Mins</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <HelpCircle size={14} className="text-sky-600" />
                                                    <span><strong>{p.total_questions || 25}</strong> Questions</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Globe size={14} className="text-purple-600" />
                                                    <span>Dual Language</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-6">
                                            <button
                                                onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=paper`, '_blank')}
                                                className="w-full py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                                            >
                                                <Printer size={15} />
                                                <span>Print Question Paper</span>
                                            </button>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=key`, '_blank')}
                                                    className="py-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span>Answer Key</span>
                                                </button>
                                                <button
                                                    onClick={() => window.open(`/api/dashboard/exams/offline/${p.id}/print?mode=solution`, '_blank')}
                                                    className="py-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#004B93] font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span>Solution Guide</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                                <button
                                                    onClick={() => handleDuplicatePaper(p.id, p.title)}
                                                    className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                                                    title="Create duplicate paper"
                                                >
                                                    <Copy size={13} /> Make Copy (Set B)
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePaper(p.id, p.title)}
                                                    className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                                                    title="Delete Paper"
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: CREATE QUESTION PAPER (COMPOSER) */}
                {activeTab === 'composer' && (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: COMPOSER FORM */}
                        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-xs">
                                    <Sparkles size={14} />
                                    <span>QUESTION PAPER BUILDER</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mt-2">Create New Question Paper</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                    Choose your school class, subject, chapters, and question paper pattern to create an exam paper.
                                </p>
                            </div>

                            <form onSubmit={handleCreatePaper} className="space-y-6 text-sm">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Exam Paper Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Class 10 Midterm Exam — Mathematics"
                                        value={composerForm.title}
                                        onChange={e => setComposerForm({ ...composerForm, title: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                {/* Dynamic Unified Syllabus Tree & Pattern Selector */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                            <BookOpen size={14} className="text-[#004B93]" />
                                            Select Syllabus & Exam Pattern
                                        </div>
                                        <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                            School Curriculum
                                        </span>
                                    </div>

                                    <ExamSyllabusPatternPicker
                                        context={blueprintContext}
                                        loadingContext={contextLoading}
                                        onRefreshContext={fetchBlueprintContext}
                                        selectedBoardId={selectedBoardId}
                                        selectedClassId={selectedClassId}
                                        selectedSubjectId={selectedSubjectId}
                                        selectedChapterIds={selectedChapterIds}
                                        selectedTopicIds={selectedTopicIds}
                                        selectedPatternId={selectedPatternId}
                                        onSelectBoard={bId => {
                                            setSelectedBoardId(bId)
                                            setSelectedClassId('')
                                            setSelectedSubjectId('')
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectClass={cNode => {
                                            setSelectedClassId(cNode.id)
                                            setComposerForm(prev => ({ ...prev, class_id: cNode.id }))
                                            setSelectedSubjectId('')
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectSubject={sNode => {
                                            setSelectedSubjectId(sNode.id)
                                            setComposerForm(prev => ({ ...prev, subject_id: sNode.id }))
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectChapters={chIds => {
                                            setSelectedChapterIds(chIds)
                                            setComposerForm(f => ({ ...f, chapter_ids: chIds }))
                                        }}
                                        onSelectTopics={tpIds => {
                                            setSelectedTopicIds(tpIds)
                                        }}
                                        onSelectPattern={pattern => {
                                            setSelectedPatternId(pattern.id)
                                            setComposerForm(prev => ({
                                                ...prev,
                                                template_id: pattern.id,
                                                marks: pattern.total_marks || prev.marks,
                                                duration: pattern.duration_minutes || prev.duration,
                                                total_questions: pattern.sections?.reduce((sum: number, s: any) => sum + (s.rules?.length || 0), 0) || prev.total_questions
                                            }))
                                            showToast(`Selected Pattern: ${pattern.name}`, true)
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Marks</label>
                                        <input
                                            type="number"
                                            value={composerForm.marks}
                                            onChange={e => setComposerForm({ ...composerForm, marks: parseInt(e.target.value) || 80 })}
                                            min={20}
                                            max={100}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            value={composerForm.duration}
                                            onChange={e => setComposerForm({ ...composerForm, duration: parseInt(e.target.value) || 180 })}
                                            min={30}
                                            max={240}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Questions</label>
                                        <input
                                            type="number"
                                            value={composerForm.total_questions}
                                            onChange={e => setComposerForm({ ...composerForm, total_questions: parseInt(e.target.value) || 25 })}
                                            min={5}
                                            max={60}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={composerForm.bilingual}
                                            onChange={e => setComposerForm({ ...composerForm, bilingual: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-900 text-xs block">Include Gujarati Translation (Dual Language)</span>
                                            <span className="text-[11px] text-slate-500">Prints English and Gujarati side-by-side on question papers.</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-700 hover:from-sky-800 hover:to-sky-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    <span>Create & Save Exam Paper</span>
                                </button>
                            </form>
                        </div>

                        {/* RIGHT: PREVIEW & INFO */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Printer size={18} className="text-[#004B93]" />
                                        <span className="font-black text-slate-900 text-sm">Paper Pattern Structure</span>
                                    </div>
                                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                                        Print-Ready Format
                                    </span>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <div className="font-extrabold text-slate-900 text-xs">Section A: Multiple Choice Questions</div>
                                        <div className="text-slate-500 text-[11px]">Objective questions with 4 options per question.</div>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <div className="font-extrabold text-slate-900 text-xs">Section B: Short Answer Questions</div>
                                        <div className="text-slate-500 text-[11px]">2-3 marks questions: definitions, equations, and short problems.</div>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <div className="font-extrabold text-slate-900 text-xs">Section C: Long Answer Questions</div>
                                        <div className="text-slate-500 text-[11px]">4-5 marks questions: detailed solutions and diagrams.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200/80 space-y-3">
                                <h4 className="font-extrabold text-purple-900 text-sm flex items-center gap-2">
                                    <Shield size={16} /> Exam Features & Safety
                                </h4>
                                <ul className="text-xs text-purple-800 space-y-2 list-disc pl-4 font-medium">
                                    <li>Questions selected from your school and board syllabus.</li>
                                    <li>Multiple paper sets (Set A, B, C, D) to prevent copying in the exam hall.</li>
                                    <li>Formatted mathematical formulas and science diagrams.</li>
                                    <li>Includes answer key and marking solutions.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: PAPER PATTERNS */}
                {activeTab === 'templates' && (
                    <div className="w-full space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Exam Paper Patterns</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                    Official board patterns and custom patterns created by your school. You can edit, delete, or create new patterns.
                                </p>
                            </div>
                            <button
                                onClick={handleOpenCreatePattern}
                                className="px-5 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-sky-950/20 self-start sm:self-auto"
                            >
                                <PlusCircle size={16} />
                                <span>Create New Paper Pattern</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {displayPatterns.length === 0 ? (
                                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                                    <Layers className="mx-auto text-slate-300 mb-3" size={48} />
                                    <h3 className="font-bold text-slate-800 text-base">No paper patterns found</h3>
                                    <p className="text-xs text-slate-500 mt-1">Click "Create New Paper Pattern" to design a paper pattern for your school.</p>
                                </div>
                            ) : (
                                displayPatterns.map((tmpl: any) => {
                                    const isOwner = Boolean(tmpl.is_owner_pattern)
                                    const sectionCount = tmpl.sections?.length || 0
                                    const questionCount = tmpl.sections?.reduce((sum: number, s: any) => {
                                        if (s.rules && s.rules.length > 0) {
                                            return sum + s.rules.reduce((rSum: number, r: any) => rSum + (Number(r.num_questions) || 0), 0)
                                        }
                                        return sum + (Number(s.total_questions) || 0)
                                    }, 0) || 0

                                    return (
                                        <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 group-hover:scale-110 transition-transform">
                                                        <Layers size={22} />
                                                    </div>
                                                    {isOwner ? (
                                                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 flex items-center gap-1">
                                                            <Shield size={11} /> Official Board
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                                                            <Award size={11} /> School Custom
                                                        </span>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">{tmpl.name}</h3>
                                                    {tmpl.description && (
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                        <span className="uppercase text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                            {tmpl.category || 'Board Standard'}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="capitalize">{tmpl.exam_type || 'Descriptive'}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span>Total Marks:</span>
                                                        <span className="font-bold text-slate-900">{tmpl.total_marks || 80} Marks</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Duration:</span>
                                                        <span className="font-bold text-slate-900">{tmpl.duration_minutes || 180} Mins</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Sections:</span>
                                                        <span className="font-bold text-slate-900">{sectionCount} Sections</span>
                                                    </div>
                                                    {questionCount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>Questions:</span>
                                                            <span className="font-bold text-slate-900">{questionCount} Questions</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-6 space-y-2">
                                                <button
                                                    onClick={() => {
                                                        setComposerForm(prev => ({
                                                            ...prev,
                                                            template_id: tmpl.id,
                                                            marks: tmpl.total_marks || 80,
                                                            duration: tmpl.duration_minutes || 180,
                                                            total_questions: questionCount || prev.total_questions
                                                        }))
                                                        setSelectedPatternId(tmpl.id)
                                                        setActiveTab('composer')
                                                        showToast(`Loaded pattern: ${tmpl.name}`, true)
                                                    }}
                                                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#004B93] text-slate-700 hover:text-white font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <span>Use in Paper Builder</span>
                                                    <ArrowUpRight size={14} />
                                                </button>

                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleOpenEditPattern(tmpl)}
                                                        className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                                                    >
                                                        <Pencil size={12} />
                                                        <span>{isOwner ? 'Customize' : 'Edit'}</span>
                                                    </button>
                                                    {!isOwner && (
                                                        <button
                                                            onClick={() => handleDeletePattern(tmpl)}
                                                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors"
                                                            title="Delete custom pattern"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: SCHOOL QUESTION BANK (ORGANIZED BY QUESTION SETS: SYLLABUS, CLASS, SUBJECT, CHAPTER) */}
                {activeTab === 'questions' && (
                    <div className="w-full space-y-6">
                        {/* VIEW A: QUESTION SETS OVERVIEW (WHEN NO SET IS EXPANDED) */}
                        {!activeSetId ? (
                            <div className="w-full space-y-6">
                                {/* HEADER & ACTIONS */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                                            <FolderOpen size={14} />
                                            <span>CURRICULUM QUESTION REPOSITORY</span>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">School Question Bank</h2>
                                    </div>
                                    <div className="flex items-center gap-3 self-start sm:self-auto">
                                        <button
                                            onClick={() => handleOpenAiGen()}
                                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Sparkles size={16} />
                                            <span>Generate with AI</span>
                                        </button>
                                    </div>
                                </div>

                                {/* SEARCH & FILTER CONTROLS */}
                                <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="relative w-full sm:w-96">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search question sets by title or chapter..."
                                            value={qSetSearchQuery}
                                            onChange={e => setQSetSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#004B93] focus:border-transparent bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                        <select
                                            value={qSetClassFilter}
                                            onChange={e => setQSetClassFilter(e.target.value)}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                        >
                                            <option value="ALL">All Classes</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={qSetSubjectFilter}
                                            onChange={e => setQSetSubjectFilter(e.target.value)}
                                            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                        >
                                            <option value="ALL">All Subjects</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* QUESTION SETS CARDS GRID */}
                                {questionBankLoading ? (
                                    <div className="py-20 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#004B93] mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium text-sm">Loading Question Sets...</p>
                                    </div>
                                ) : filteredQuestionSets.length === 0 ? (
                                    <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                                        <FolderOpen className="mx-auto text-slate-300 mb-3" size={48} />
                                        <h3 className="font-bold text-slate-800 text-base">No question sets found</h3>
                                        <p className="text-xs text-slate-500 mt-1">Click "Generate with AI" to create and store question sets organized by syllabus, class, subject, and chapters.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredQuestionSets.map(qs => (
                                            <div key={qs.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all group">
                                                <div className="space-y-4">
                                                    {/* CARD HEADER WITH BADGES */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                                                            <Database size={22} />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                                                                {qs.class_name || 'Class'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                                                                {qs.subject_name || 'Subject'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* SET TITLE & DESCRIPTION */}
                                                    <div>
                                                        <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-[#004B93] transition-colors line-clamp-2">
                                                            {qs.title}
                                                        </h3>
                                                        {qs.chapter_name && (
                                                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mt-1.5">
                                                                <BookOpen size={13} className="text-emerald-600 shrink-0" />
                                                                <span className="line-clamp-1">{qs.chapter_name}</span>
                                                            </div>
                                                        )}
                                                        {qs.description && (
                                                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{qs.description}</p>
                                                        )}
                                                    </div>

                                                    {/* STATS STRIP */}
                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <HelpCircle size={14} className="text-sky-600" />
                                                            <span><strong>{qs.total_questions || 0}</strong> Questions</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <Target size={14} className="text-emerald-600" />
                                                            <span><strong>{qs.total_marks || 0}</strong> Total Marks</span>
                                                        </div>
                                                    </div>

                                                    {/* DIFFICULTY PILLS */}
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                            {qs.easy_count || 0} Easy
                                                        </span>
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                                            {qs.medium_count || 0} Med
                                                        </span>
                                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                                            {qs.hard_count || 0} Hard
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="space-y-2 pt-6">
                                                    <button
                                                        onClick={() => {
                                                            setActiveSetId(qs.id)
                                                            fetchSetQuestions(qs.id)
                                                        }}
                                                        className="w-full py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Eye size={15} />
                                                        <span>View Questions ({qs.total_questions || 0})</span>
                                                    </button>

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                            onClick={() => handleOpenAddQuestion(qs.id)}
                                                            className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200 transition-colors"
                                                        >
                                                            <Plus size={13} />
                                                            <span>Add</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenAiGen(qs.id)}
                                                            className="flex-1 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-1 border border-purple-200 transition-colors"
                                                            title="Generate questions for this set with AI"
                                                        >
                                                            <Sparkles size={13} />
                                                            <span>AI Gen</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditSet(qs)}
                                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                                                            title="Edit question set details"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSet(qs.id, qs.title)}
                                                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors"
                                                            title="Delete entire question set"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* VIEW B: INSIDE SPECIFIC QUESTION SET (QUESTIONS LIST VIEW) */
                            <div className="w-full space-y-6">
                                {/* ACTIVE SET HEADER */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <button
                                            onClick={() => {
                                                setActiveSetId(null)
                                                setActiveSetData(null)
                                                setActiveSetQuestions([])
                                                fetchQuestionSets()
                                            }}
                                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#004B93] transition-colors self-start"
                                        >
                                            <ChevronLeft size={16} />
                                            <span>Back to All Question Sets</span>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenAiGen(activeSetId)}
                                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-purple-600/20 transition-all"
                                            >
                                                <Sparkles size={15} />
                                                <span>Generate with AI</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenAddQuestion(activeSetId)}
                                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                            >
                                                <Plus size={15} />
                                                <span>Add New Question</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSet(activeSetId, activeSetData?.title || 'this set')}
                                                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition-all"
                                                title="Delete entire question set"
                                            >
                                                <Trash2 size={15} />
                                                <span>Delete Set</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                                                {activeSetData?.title || 'Question Set'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                                                <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                                                    {activeSetData?.class_name || 'Class'}
                                                </span>
                                                <span>•</span>
                                                <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                                                    {activeSetData?.subject_name || 'Subject'}
                                                </span>
                                                {activeSetData?.chapter_name && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-semibold text-slate-700">
                                                            {activeSetData.chapter_name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                                            <span className="text-slate-700">{activeSetQuestions.length} Questions</span>
                                            <span>•</span>
                                            <span className="text-emerald-700">
                                                {activeSetQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)} Total Marks
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* QUESTIONS IN THIS SET */}
                                {loadingSetDetails ? (
                                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
                                        <Loader2 size={32} className="animate-spin text-[#004B93] mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium text-sm">Loading questions in this set...</p>
                                    </div>
                                ) : activeSetQuestions.length === 0 ? (
                                    <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
                                        <HelpCircle className="mx-auto text-slate-300 mb-3" size={48} />
                                        <h4 className="font-bold text-slate-800 text-base">No questions in this set yet</h4>
                                        <p className="text-xs text-slate-500 mt-1">Click "Add New Question" above to add the first question to this set.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeSetQuestions.map((q, idx) => {
                                            const options = Array.isArray(q.options) ? q.options : []
                                            const correctAns = String(q.correct_answer || '').trim()

                                            return (
                                                <div key={`active_set_q_${idx}_${q.id || 'item'}`} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-shadow space-y-3">
                                                    {/* TOP BAR: NUMBER, TYPE, DIFFICULTY, MARKS & ACTIONS */}
                                                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="w-7 h-7 rounded-lg bg-[#004B93] text-white font-black text-xs flex items-center justify-center">
                                                                Q{idx + 1}
                                                            </span>
                                                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                                {q.sub_type || q.type || 'Objective'}
                                                            </span>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                                q.difficulty === 'hard' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                                            }`}>
                                                                {q.difficulty || 'Medium'}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                                                {q.marks || 1} {Number(q.marks) === 1 ? 'Mark' : 'Marks'}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenEditQuestion(q)}
                                                                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                                                            >
                                                                <Pencil size={12} />
                                                                <span>Edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteQuestion(q.id)}
                                                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors"
                                                                title="Delete question"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* QUESTION TEXT */}
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-sm leading-relaxed">
                                                            {q.text_en || (typeof q.question_text === 'object' ? q.question_text?.en : q.question_text)}
                                                        </p>
                                                        {q.text_gu && (
                                                            <p className="text-xs text-slate-500 font-medium font-sans">
                                                                {q.text_gu}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* OPTIONS GRID (IF MCQ) */}
                                                    {options.length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                                            {options.map((opt: string, optIdx: number) => {
                                                                const optLabel = String.fromCharCode(65 + optIdx)
                                                                const isCorrect = correctAns === optLabel || correctAns.toLowerCase() === opt.toLowerCase()

                                                                return (
                                                                    <div
                                                                        key={optIdx}
                                                                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                                                                            isCorrect
                                                                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                                                                                : 'bg-slate-50 border-slate-200 text-slate-700'
                                                                        }`}
                                                                    >
                                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${
                                                                            isCorrect
                                                                                ? 'bg-emerald-600 text-white'
                                                                                : 'bg-slate-200 text-slate-700'
                                                                        }`}>
                                                                            {optLabel}
                                                                        </span>
                                                                        <span className="flex-1">{opt}</span>
                                                                        {isCorrect && (
                                                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* EXPLANATION / SOLUTION */}
                                                    {q.explanation && (
                                                        <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-700 space-y-0.5 mt-2">
                                                            <span className="font-bold text-sky-900 block text-[11px] uppercase tracking-wider">Answer Solution & Explanation</span>
                                                            <p className="text-slate-600">{q.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: PRINT & DOWNLOAD CENTER */}
                {activeTab === 'packaging' && (
                    <div className="w-full space-y-6">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h2 className="text-2xl font-black text-slate-900">Print & Download Center</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                    Print examination question papers, student answer sheets, and answer keys for the exam hall.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#004B93] flex items-center justify-center font-black">
                                        A
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">Multiple Exam Sets (Sets A, B, C, D)</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Creates different sets of questions so students sitting next to each other receive different question orderings.
                                    </p>
                                    <button
                                        onClick={() => showToast('Question sets A, B, C, D ready for printing', true)}
                                        className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300"
                                    >
                                        Configure Sets
                                    </button>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                                        <Shield size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">School Watermark & Header</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Prints your school name, crest, examination instructions, and QR code clearly on every question paper.
                                    </p>
                                    <button
                                        onClick={() => showToast('School watermark and header active on all papers', true)}
                                        className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300"
                                    >
                                        Check Watermark
                                    </button>
                                </div>

                                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                                        <Printer size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-base">Print All Exam Papers</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Formatted for standard school printers and photocopiers in clean, sharp high-resolution A4 size.
                                    </p>
                                    <button
                                        onClick={() => showToast('Sending question papers to printer queue...', true)}
                                        className="w-full py-2 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-sm"
                                    >
                                        Print Question Papers
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: CREATE EXAMINATION PAPER */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
                        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Create Examination Paper</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Set up exam details, select chapters, and pick an exam paper pattern.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePaper} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Exam Paper Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Grade 10 Midterm Mathematics Assessment"
                                        value={composerForm.title}
                                        onChange={e => setComposerForm({ ...composerForm, title: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                                            <BookOpen size={14} className="text-[#004B93]" />
                                            Select Syllabus & Exam Pattern
                                        </div>
                                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                            School & Board Catalog
                                        </span>
                                    </div>

                                    <ExamSyllabusPatternPicker
                                        context={blueprintContext}
                                        loadingContext={contextLoading}
                                        onRefreshContext={fetchBlueprintContext}
                                        selectedBoardId={selectedBoardId}
                                        selectedClassId={selectedClassId}
                                        selectedSubjectId={selectedSubjectId}
                                        selectedChapterIds={selectedChapterIds}
                                        selectedTopicIds={selectedTopicIds}
                                        selectedPatternId={selectedPatternId}
                                        onSelectBoard={bId => {
                                            setSelectedBoardId(bId)
                                            setSelectedClassId('')
                                            setSelectedSubjectId('')
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectClass={cNode => {
                                            setSelectedClassId(cNode.id)
                                            setComposerForm(prev => ({ ...prev, class_id: cNode.id }))
                                            setSelectedSubjectId('')
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectSubject={sNode => {
                                            setSelectedSubjectId(sNode.id)
                                            setComposerForm(prev => ({ ...prev, subject_id: sNode.id }))
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectChapters={chIds => {
                                            setSelectedChapterIds(chIds)
                                            setComposerForm(f => ({ ...f, chapter_ids: chIds }))
                                        }}
                                        onSelectTopics={tpIds => {
                                            setSelectedTopicIds(tpIds)
                                        }}
                                        onSelectPattern={pattern => {
                                            setSelectedPatternId(pattern.id)
                                            setComposerForm(prev => ({
                                                ...prev,
                                                template_id: pattern.id,
                                                marks: pattern.total_marks || prev.marks,
                                                duration: pattern.duration_minutes || prev.duration
                                            }))
                                            showToast(`Selected Pattern: ${pattern.name}`, true)
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Marks</label>
                                        <input
                                            type="number"
                                            value={composerForm.marks}
                                            onChange={e => setComposerForm({ ...composerForm, marks: parseInt(e.target.value) || 80 })}
                                            min={20}
                                            max={100}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            value={composerForm.duration}
                                            onChange={e => setComposerForm({ ...composerForm, duration: parseInt(e.target.value) || 180 })}
                                            min={30}
                                            max={240}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={composerForm.bilingual}
                                            onChange={e => setComposerForm({ ...composerForm, bilingual: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-900 text-xs block">Include Gujarati Translation (Dual Language)</span>
                                            <span className="text-[11px] text-slate-500">Prints English and Gujarati side-by-side on question papers.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                    <span>Create Exam Paper</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: CREATE / EDIT PAPER PATTERN */}
            {isPatternModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
                        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {patternModalMode === 'create' ? 'Create New Paper Pattern' : 'Edit Paper Pattern'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {patternForm.is_owner_pattern
                                        ? 'Customizing an official board pattern into a school custom pattern.'
                                        : 'Define pattern title, total marks, duration, and section question breakdown.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPatternModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSavePattern} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Pattern Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g., CBSE Class 10 Pre-Board Assessment"
                                            value={patternForm.name}
                                            onChange={e => setPatternForm({ ...patternForm, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Pattern Category</label>
                                        <select
                                            value={patternForm.category}
                                            onChange={e => setPatternForm({ ...patternForm, category: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none bg-white"
                                        >
                                            <option value="Board Standard">Board Standard</option>
                                            <option value="Term Exam">Term Exam</option>
                                            <option value="Unit Test">Unit Test</option>
                                            <option value="Competitive Exam">Competitive Exam</option>
                                            <option value="Weekly Quiz">Weekly Quiz</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Marks</label>
                                        <input
                                            type="number"
                                            value={patternForm.total_marks}
                                            onChange={e => setPatternForm({ ...patternForm, total_marks: parseInt(e.target.value) || 80 })}
                                            min={10}
                                            max={200}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Duration (Minutes)</label>
                                        <input
                                            type="number"
                                            value={patternForm.duration_minutes}
                                            onChange={e => setPatternForm({ ...patternForm, duration_minutes: parseInt(e.target.value) || 180 })}
                                            min={15}
                                            max={360}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Paper Type</label>
                                        <select
                                            value={patternForm.exam_type}
                                            onChange={e => setPatternForm({ ...patternForm, exam_type: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none bg-white"
                                        >
                                            <option value="descriptive">Descriptive (Theory & Numerical)</option>
                                            <option value="objective">Objective (MCQ / Fill in blanks)</option>
                                            <option value="hybrid">Hybrid (Objective + Descriptive)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">General Instructions</label>
                                    <textarea
                                        rows={3}
                                        value={patternForm.instructions}
                                        onChange={e => setPatternForm({ ...patternForm, instructions: e.target.value })}
                                        placeholder="1. All questions are compulsory..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 text-sm">Sections & Question Breakdown</h4>
                                            <p className="text-xs text-slate-500">Configure sections (Section A, Section B, etc.) and types of questions in each.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddSection}
                                            className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1 border border-purple-200"
                                        >
                                            <Plus size={14} /> Add Section
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {patternForm.sections.map((section, sIdx) => (
                                            <div key={sIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            value={section.section_name}
                                                            onChange={e => {
                                                                const val = e.target.value
                                                                setPatternForm(prev => {
                                                                    const newSections = [...prev.sections]
                                                                    newSections[sIdx] = { ...newSections[sIdx], section_name: val }
                                                                    return { ...prev, sections: newSections }
                                                                })
                                                            }}
                                                            placeholder="Section Name (e.g. Section A)"
                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={section.instructions}
                                                            onChange={e => {
                                                                const val = e.target.value
                                                                setPatternForm(prev => {
                                                                    const newSections = [...prev.sections]
                                                                    newSections[sIdx] = { ...newSections[sIdx], instructions: val }
                                                                    return { ...prev, sections: newSections }
                                                                })
                                                            }}
                                                            placeholder="Section Instructions (e.g. 1 mark each)"
                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSection(sIdx)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                                        title="Remove section"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="space-y-2 pt-1">
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                                                        <span>Question Rules</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddRuleToSection(sIdx)}
                                                            className="text-sky-700 hover:text-[#004B93] flex items-center gap-1 font-bold lowercase first-letter:uppercase"
                                                        >
                                                            <Plus size={12} /> add rule
                                                        </button>
                                                    </div>

                                                    {section.rules.map((rule, rIdx) => (
                                                        <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 items-center text-xs">
                                                            <div>
                                                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Question Type</label>
                                                                <select
                                                                    value={rule.question_type}
                                                                    onChange={e => {
                                                                        const val = e.target.value
                                                                        setPatternForm(prev => {
                                                                            const newSections = [...prev.sections]
                                                                            const newRules = [...newSections[sIdx].rules]
                                                                            newRules[rIdx] = { ...newRules[rIdx], question_type: val }
                                                                            newSections[sIdx] = { ...newSections[sIdx], rules: newRules }
                                                                            return { ...prev, sections: newSections }
                                                                        })
                                                                    }}
                                                                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                                                                >
                                                                    <option value="mcq">Multiple Choice (MCQ)</option>
                                                                    <option value="short_answer">Short Answer</option>
                                                                    <option value="long_answer">Long Answer</option>
                                                                    <option value="fill_blank">Fill in Blanks</option>
                                                                    <option value="true_false">True / False</option>
                                                                    <option value="assertion_reason">Assertion & Reason</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">No. of Questions</label>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={50}
                                                                    value={rule.num_questions}
                                                                    onChange={e => {
                                                                        const val = parseInt(e.target.value) || 1
                                                                        setPatternForm(prev => {
                                                                            const newSections = [...prev.sections]
                                                                            const newRules = [...newSections[sIdx].rules]
                                                                            newRules[rIdx] = { ...newRules[rIdx], num_questions: val }
                                                                            newSections[sIdx] = { ...newSections[sIdx], rules: newRules }
                                                                            return { ...prev, sections: newSections }
                                                                        })
                                                                    }}
                                                                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Marks Per Question</label>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={20}
                                                                    value={rule.marks_per_question}
                                                                    onChange={e => {
                                                                        const val = parseInt(e.target.value) || 1
                                                                        setPatternForm(prev => {
                                                                            const newSections = [...prev.sections]
                                                                            const newRules = [...newSections[sIdx].rules]
                                                                            newRules[rIdx] = { ...newRules[rIdx], marks_per_question: val }
                                                                            newSections[sIdx] = { ...newSections[sIdx], rules: newRules }
                                                                            return { ...prev, sections: newSections }
                                                                        })
                                                                    }}
                                                                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between pt-3 sm:pt-0">
                                                                <span className="text-[11px] font-bold text-slate-700">
                                                                    = {(rule.num_questions || 0) * (rule.marks_per_question || 0)} Marks
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveRuleFromSection(sIdx, rIdx)}
                                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                                                    title="Remove question rule"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsPatternModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={patternSaving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    {patternSaving ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                                    <span>{patternModalMode === 'create' ? 'Save Paper Pattern' : 'Update Paper Pattern'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: EDIT QUESTION SET */}
            {isSetModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
                        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    Edit Question Set
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Update title, description, class, subject, and chapter details.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSetModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSet} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 text-sm">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Question Set Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., Class 8 English — Unit 5: This is Jody's Fawn"
                                        value={setForm.title}
                                        onChange={e => setSetForm({ ...setForm, title: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Description (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g., Comprehensive textbook question bank covering short answers, MCQs, and textual comprehension."
                                        value={setForm.description}
                                        onChange={e => setSetForm({ ...setForm, description: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Class / Standard</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Class 8"
                                            value={setForm.class_name}
                                            onChange={e => setSetForm({ ...setForm, class_name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Subject</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. English"
                                            value={setForm.subject_name}
                                            onChange={e => setSetForm({ ...setForm, subject_name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Chapter / Unit Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. This is Jody's Fawn"
                                        value={setForm.chapter_name}
                                        onChange={e => setSetForm({ ...setForm, chapter_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsSetModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSet}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    {savingSet ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: ADD / EDIT QUESTION IN SET */}
            {isQuestionModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
                        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {questionModalMode === 'create' ? 'Add New Question' : 'Edit Question'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Define question text, options, answer key, and marks.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsQuestionModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuestion} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Question Type</label>
                                        <select
                                            value={questionForm.sub_type}
                                            onChange={e => {
                                                const val = e.target.value
                                                setQuestionForm({
                                                    ...questionForm,
                                                    sub_type: val,
                                                    type: val === 'mcq' ? 'objective' : 'subjective'
                                                })
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
                                        >
                                            <option value="mcq">Multiple Choice (MCQ)</option>
                                            <option value="short_answer">Short Answer</option>
                                            <option value="long_answer">Long Answer</option>
                                            <option value="fill_blank">Fill in Blanks</option>
                                            <option value="true_false">True / False</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Marks</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={questionForm.marks}
                                            onChange={e => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Difficulty</label>
                                        <select
                                            value={questionForm.difficulty}
                                            onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Question Text (English)</label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Enter the complete question here..."
                                        value={questionForm.text_en}
                                        onChange={e => setQuestionForm({ ...questionForm, text_en: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Question Text (Gujarati / Regional - Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="પ્રશ્ન અહીં ગુજરાતીમાં દાખલ કરો (વૈકલ્પિક)..."
                                        value={questionForm.text_gu}
                                        onChange={e => setQuestionForm({ ...questionForm, text_gu: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none text-sm"
                                    />
                                </div>

                                {/* OPTIONS INPUT IF MCQ */}
                                {questionForm.sub_type === 'mcq' && (
                                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                                                Multiple Choice Options (Select Correct Answer)
                                            </span>
                                            <span className="text-[11px] font-semibold text-emerald-700">
                                                Radio button selects correct option
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {['A', 'B', 'C', 'D'].map((label, optIdx) => {
                                                const currentOptions = Array.isArray(questionForm.options) ? [...questionForm.options] : ['', '', '', '']
                                                while (currentOptions.length < 4) currentOptions.push('')
                                                const isCorrect = questionForm.correct_answer === label || questionForm.correct_answer === currentOptions[optIdx]

                                                return (
                                                    <div key={label} className={`p-3 rounded-xl border flex items-center gap-2.5 bg-white ${
                                                        isCorrect ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                                                    }`}>
                                                        <input
                                                            type="radio"
                                                            name="correct_option"
                                                            checked={isCorrect}
                                                            onChange={() => setQuestionForm({ ...questionForm, correct_answer: label })}
                                                            className="w-4 h-4 text-emerald-600"
                                                        />
                                                        <span className="font-bold text-xs text-slate-500 w-5">{label}.</span>
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${label}`}
                                                            value={currentOptions[optIdx] || ''}
                                                            onChange={e => {
                                                                const updated = [...currentOptions]
                                                                updated[optIdx] = e.target.value
                                                                setQuestionForm({ ...questionForm, options: updated })
                                                            }}
                                                            className="flex-1 text-xs font-medium text-slate-900 focus:outline-none"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* CORRECT ANSWER IF NOT MCQ */}
                                {questionForm.sub_type !== 'mcq' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Correct Answer / Key Points</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., The degree is 4 because..."
                                            value={questionForm.correct_answer}
                                            onChange={e => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Explanation / Solution Notes (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Detailed explanation for the answer guide..."
                                        value={questionForm.explanation}
                                        onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsQuestionModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={questionSaving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    {questionSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span>{questionModalMode === 'create' ? 'Add Question' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── AI QUESTION GENERATOR MODAL ──────────────────────────────── */}
            {isAiGenModalOpen && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-6xl w-full sm:w-[96vw] border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[94vh] flex flex-col">
                        {/* MODAL HEADER */}
                        <div className="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-sky-50/90 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-700">AI Curriculum Assistant</div>
                                    <h2 className="text-lg font-black text-slate-900">AI Question Generator & Bank Studio</h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAiGenModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                            {/* SECTION 1: QUESTION SET NAME & CURRICULUM PARAMETERS */}
                            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                    <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <Sliders size={14} className="text-purple-600" />
                                        <span>Curriculum & Generation Parameters</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">
                                        Active Board: <strong className="text-purple-700 font-black">{aiGenForm.board_name || 'Gujarat Board'}</strong>
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {/* Question Set Name (Auto-generated with Board, Class, Subject - Editable) */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                    Question Set Name <span className="text-rose-500">*</span>
                                                </label>
                                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200">
                                                    Format: Board — Class Subject
                                                </span>
                                            </div>
                                            {isCustomNameEdited && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomNameEdited(false)
                                                        setAiGenForm(prev => ({
                                                            ...prev,
                                                            setName: computeAutoSetName(prev.board_name, prev.class_name, prev.subject_name)
                                                        }))
                                                    }}
                                                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>Reset to Auto Name</span>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g., Gujarat Board (English Medium) — Class 1 English"
                                            value={aiGenForm.setName}
                                            onChange={e => {
                                                setIsCustomNameEdited(true)
                                                setAiGenForm({ ...aiGenForm, setName: e.target.value })
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none text-xs sm:text-sm shadow-sm"
                                        />
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Auto-generated with board name, class, and subject (does not include chapters or topics). Fully editable.
                                        </p>
                                    </div>

                                    {/* 3-COLUMN SELECTORS: BOARD, CLASS, SUBJECT (FETCHED STRICTLY FROM COURSE SYLLABUS) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Select Syllabus / Board */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                                Select Syllabus / Board <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={aiGenForm.board_name}
                                                onChange={e => handleBoardChange(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none text-xs sm:text-sm"
                                            >
                                                {availableBoardsForAi.length === 0 ? (
                                                    <option value="">No Active Boards in Course Syllabus</option>
                                                ) : (
                                                    availableBoardsForAi.map(b => (
                                                        <option key={b.id || b.name} value={b.name}>{b.name}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        {/* Select Class */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                                Target Class / Grade <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={aiGenForm.class_name}
                                                onChange={e => handleClassChange(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none text-xs sm:text-sm"
                                            >
                                                {availableClassesForAi.length === 0 ? (
                                                    <option value="">No Classes Found</option>
                                                ) : (
                                                    availableClassesForAi.map(c => (
                                                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        {/* Select Subject */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                                Subject <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={aiGenForm.subject_name}
                                                onChange={e => handleSubjectChange(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none text-xs sm:text-sm"
                                            >
                                                {availableSubjectsForAi.length === 0 ? (
                                                    <option value="">No Subjects Found</option>
                                                ) : (
                                                    availableSubjectsForAi.map(s => (
                                                        <option key={s.id || s.name} value={s.name}>{s.name}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    {/* CHAPTERS & TOPICS MULTIPLE SELECTION (2 CARDS SIDE-BY-SIDE) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                        {/* COLUMN 1: CHAPTERS (MULTIPLE SELECTION) */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                                            <BookOpen size={14} className="text-purple-600" />
                                                            <span>Chapters (Multiple Selection)</span>
                                                        </label>
                                                        <span className="text-[11px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                                            {aiGenForm.selected_chapters.length} / {availableChaptersForAi.length} Selected
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAiGenForm(prev => ({
                                                                    ...prev,
                                                                    selected_chapters: availableChaptersForAi.map(c => c.name)
                                                                }))
                                                            }}
                                                            className="text-purple-700 hover:text-purple-900 font-bold text-[11px] hover:underline"
                                                        >
                                                            Select All
                                                        </button>
                                                        <span className="text-slate-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAiGenForm(prev => ({
                                                                    ...prev,
                                                                    selected_chapters: []
                                                                }))
                                                            }}
                                                            className="text-slate-500 hover:text-slate-700 font-bold text-[11px] hover:underline"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* CHAPTER CHECKBOXES LIST */}
                                                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                                    {availableChaptersForAi.length === 0 ? (
                                                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                                                            No chapters found in course syllabus for this subject.
                                                        </div>
                                                    ) : (
                                                        availableChaptersForAi.map(ch => {
                                                            const isChecked = aiGenForm.selected_chapters.includes(ch.name)
                                                            return (
                                                                <label
                                                                    key={ch.id || ch.name}
                                                                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                                                        isChecked
                                                                            ? 'bg-purple-50/90 border-purple-300 text-purple-950 font-bold shadow-xs'
                                                                            : 'bg-slate-50/40 border-slate-200/80 text-slate-700 hover:bg-slate-100/80 font-medium'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handleToggleChapter(ch.name)}
                                                                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                                                                    />
                                                                    <span className="leading-snug">{ch.name}</span>
                                                                </label>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <span>Select one or multiple chapters</span>
                                                <span>{availableChaptersForAi.length} total chapters</span>
                                            </p>
                                        </div>

                                        {/* COLUMN 2: TOPICS (MULTIPLE SELECTION) */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                                            <ListFilter size={14} className="text-indigo-600" />
                                                            <span>Topics (Multiple Selection)</span>
                                                        </label>
                                                        <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                                            {aiGenForm.selected_topics.length} / {availableTopicsForAi.length} Selected
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAiGenForm(prev => ({
                                                                    ...prev,
                                                                    selected_topics: availableTopicsForAi.map(t => t.name)
                                                                }))
                                                            }}
                                                            className="text-indigo-700 hover:text-indigo-900 font-bold text-[11px] hover:underline"
                                                        >
                                                            Select All
                                                        </button>
                                                        <span className="text-slate-300">•</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setAiGenForm(prev => ({
                                                                    ...prev,
                                                                    selected_topics: []
                                                                }))
                                                            }}
                                                            className="text-slate-500 hover:text-slate-700 font-bold text-[11px] hover:underline"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* TOPICS CHECKBOXES LIST */}
                                                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                                    {availableTopicsForAi.length === 0 ? (
                                                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                                                            No predefined topics mapped. Add custom topics below.
                                                        </div>
                                                    ) : (
                                                        availableTopicsForAi.map(tp => {
                                                            const isChecked = aiGenForm.selected_topics.includes(tp.name)
                                                            return (
                                                                <label
                                                                    key={tp.id || tp.name}
                                                                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                                                        isChecked
                                                                            ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-bold shadow-xs'
                                                                            : 'bg-slate-50/40 border-slate-200/80 text-slate-700 hover:bg-slate-100/80 font-medium'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handleToggleTopic(tp.name)}
                                                                        className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                                                    />
                                                                    <div className="leading-snug">
                                                                        <span>{tp.name}</span>
                                                                        {tp.chapter_name && (
                                                                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                                                                Chapter: {tp.chapter_name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            {/* CUSTOM TOPIC INPUT */}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Add custom topic or specific focus..."
                                                        value={customTopicInput}
                                                        onChange={e => setCustomTopicInput(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                handleAddCustomChapter()
                                                            }
                                                        }}
                                                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCustomChapter}
                                                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0 transition-colors border border-indigo-200"
                                                    >
                                                        + Add Topic
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3-COLUMN ROW: QUESTION FORMAT, DIFFICULTY, NUMBER OF QUESTIONS */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                        {/* Question Type */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Question Format</label>
                                            <select
                                                value={aiGenForm.type}
                                                onChange={e => setAiGenForm({ ...aiGenForm, type: e.target.value as any })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none text-xs sm:text-sm"
                                            >
                                                <option value="objective">Multiple Choice (MCQ with Options A, B, C, D)</option>
                                                <option value="subjective">Theory / Short & Long Descriptive</option>
                                            </select>
                                        </div>

                                        {/* Difficulty */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Difficulty Level</label>
                                            <select
                                                value={aiGenForm.difficulty}
                                                onChange={e => setAiGenForm({ ...aiGenForm, difficulty: e.target.value as any })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none text-xs sm:text-sm"
                                            >
                                                <option value="easy">Easy (Foundational Concepts)</option>
                                                <option value="medium">Medium (Standard Board Exam Level)</option>
                                                <option value="hard">Hard (Higher-Order Thinking Skills / Analytical)</option>
                                            </select>
                                        </div>

                                        {/* Number of Questions: CUSTOM NUMBER INPUT */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                    Question Count <span className="text-rose-500">*</span>
                                                </label>
                                                <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                                    Target: {aiGenForm.count}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    value={aiGenForm.count}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 1
                                                        setAiGenForm({ ...aiGenForm, count: Math.max(1, Math.min(50, val)) })
                                                    }}
                                                    className="w-20 px-3 py-2 rounded-xl border border-slate-200 font-black text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm text-center bg-white shadow-sm"
                                                />
                                                <div className="flex items-center gap-1 flex-wrap flex-1">
                                                    {[3, 5, 10, 15, 20].map(n => (
                                                        <button
                                                            key={n}
                                                            type="button"
                                                            onClick={() => setAiGenForm({ ...aiGenForm, count: n })}
                                                            className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                                                                aiGenForm.count === n
                                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        disabled={isAiGenerating}
                                        onClick={handleRunAiGeneration}
                                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isAiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        <span>{isAiGenerating ? 'Generating Questions...' : 'Generate Questions with AI'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* SECTION 2: DYNAMIC GENERATION PROGRESS BAR */}
                            {isAiGenerating && (
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-sky-50 border border-purple-200/80 shadow-inner space-y-3 animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                                                <Sparkles size={18} className="animate-spin" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900">AI Curriculum Question Generator Working</h4>
                                                <p className="text-[11px] text-purple-800 font-semibold">{aiGenStatusText}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs sm:text-sm font-black text-purple-700 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-sm">
                                            {aiGenProgress}%
                                        </span>
                                    </div>

                                    {/* PROGRESS BAR TRACK */}
                                    <div className="w-full h-3 bg-purple-200/60 rounded-full overflow-hidden p-0.5 shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 rounded-full transition-all duration-300 relative overflow-hidden"
                                            style={{ width: `${aiGenProgress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/25 animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                        <span>Syllabus: {aiGenForm.board_name} · {aiGenForm.class_name} · {aiGenForm.subject_name}</span>
                                        <span>Target: {aiGenForm.count} Questions</span>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 3: GENERATED QUESTIONS LIST WITH INLINE EDIT, DELETE, ADD */}
                            {aiGeneratedQuestions.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                    Generated Questions ({aiGeneratedQuestions.length})
                                                </span>
                                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                    Ready for Review & Approval
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Review, inline edit question text, answers, or options. Add or delete questions before final approval.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleAddManualQuestion}
                                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                            >
                                                <Plus size={14} />
                                                <span>Add Question</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* QUESTIONS LIST WITH INLINE EDITING */}
                                    <div className="space-y-4">
                                        {aiGeneratedQuestions.map((q, idx) => {
                                            const opts = Array.isArray(q.options) ? q.options : []
                                            const isMcq = q.type === 'objective' || (!q.type && opts.length > 0)

                                            return (
                                                <div
                                                    key={`ai_q_${idx}_${q.id || 'item'}`}
                                                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-md transition-all space-y-3.5"
                                                >
                                                    {/* CARD TOP BAR */}
                                                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-black">
                                                                Q{idx + 1}
                                                            </span>
                                                            <select
                                                                value={q.type}
                                                                onChange={e => handleUpdateQuestionField(idx, 'type', e.target.value)}
                                                                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
                                                            >
                                                                <option value="objective">Multiple Choice (MCQ)</option>
                                                                <option value="subjective">Theory / Descriptive</option>
                                                            </select>
                                                            <select
                                                                value={q.difficulty}
                                                                onChange={e => handleUpdateQuestionField(idx, 'difficulty', e.target.value)}
                                                                className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-purple-800 bg-purple-50 uppercase"
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="hard">Hard</option>
                                                            </select>
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={20}
                                                                    value={q.marks || 1}
                                                                    onChange={e => handleUpdateQuestionField(idx, 'marks', parseInt(e.target.value) || 1)}
                                                                    className="w-12 px-1.5 py-0.5 rounded border border-slate-200 text-xs font-bold text-center"
                                                                />
                                                                <span className="text-xs text-slate-500 font-semibold">Marks</span>
                                                            </div>
                                                        </div>

                                                        {/* DELETE QUESTION ACTION */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAiQuestion(idx)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Delete this question"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* INLINE QUESTION TEXT EDIT */}
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                                            Question Text
                                                        </label>
                                                        <textarea
                                                            rows={2}
                                                            value={q.question_text || q.text || ''}
                                                            onChange={e => handleUpdateQuestionField(idx, 'question_text', e.target.value)}
                                                            placeholder="Enter question text..."
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50/50 hover:bg-white transition-colors"
                                                        />
                                                    </div>

                                                    {/* INLINE MCQ OPTIONS EDIT */}
                                                    {isMcq && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                                                Options & Correct Answer (Click letter to set correct answer)
                                                            </label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {['A', 'B', 'C', 'D'].map((label, optIdx) => {
                                                                    const optVal = Array.isArray(q.options) ? (q.options[optIdx] || '') : ''
                                                                    const isCorrect = q.correct_answer === label || q.correct_answer === optVal
                                                                    return (
                                                                        <div
                                                                            key={label}
                                                                            className={`flex items-center gap-2 p-1.5 rounded-xl border transition-colors ${
                                                                                isCorrect
                                                                                    ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300'
                                                                                    : 'bg-slate-50 border-slate-200'
                                                                            }`}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleUpdateQuestionField(idx, 'correct_answer', label)}
                                                                                title="Click to mark as correct answer"
                                                                                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                                                                                    isCorrect
                                                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                                                        : 'bg-slate-200 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                                                                                }`}
                                                                            >
                                                                                {label}
                                                                            </button>
                                                                            <input
                                                                                type="text"
                                                                                value={optVal}
                                                                                onChange={e => handleUpdateQuestionOption(idx, optIdx, e.target.value)}
                                                                                placeholder={`Option ${label}`}
                                                                                className="flex-1 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                                                                            />
                                                                            {isCorrect && (
                                                                                <Check size={14} className="text-emerald-600 mr-1 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* INLINE SUBJECTIVE ANSWER KEY */}
                                                    {!isMcq && (
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                                                Model Answer / Marking Scheme
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                value={q.correct_answer || ''}
                                                                onChange={e => handleUpdateQuestionField(idx, 'correct_answer', e.target.value)}
                                                                placeholder="Enter model answer or key points..."
                                                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50/50"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* INLINE EXPLANATION */}
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                                            Explanation / Solution Guide
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={q.explanation || ''}
                                                            onChange={e => handleUpdateQuestionField(idx, 'explanation', e.target.value)}
                                                            placeholder="Step-by-step marking rationale and solution..."
                                                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50/50"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER WITH APPROVE & STORE */}
                        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsAiGenModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white text-xs sm:text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSavingAiQuestions || aiGeneratedQuestions.length === 0}
                                onClick={handleSaveAiGeneratedQuestions}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isSavingAiQuestions ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                <span>
                                    {isSavingAiQuestions
                                        ? 'Storing Question Set...'
                                        : `Approve & Store Question Set (${aiGeneratedQuestions.length})`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

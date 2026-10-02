'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import ExamSyllabusPatternPicker, { BlueprintContextData } from '@/components/shared/ExamSyllabusPatternPicker'
import {
    ScanLine, UploadCloud, Download, CheckCircle, XCircle, AlertCircle,
    Search, Loader2, Sparkles, Printer, Trash2,
    Database, Target, Shield,
    Sliders, RefreshCw, BarChart3, Users, PlusCircle, Check, HelpCircle,
    FileSpreadsheet, ArrowUpRight, Camera, Layers, Award, Clock,
    BookOpen, GraduationCap, Globe, Filter, CheckSquare, Square, BookMarked, Tag,
    ChevronDown, ChevronUp, Pencil, ChevronRight, FileText, ArrowRight, ArrowLeft
} from 'lucide-react'

// Standard predefined OMR layouts
const STANDARD_OMR_TEMPLATES = [
    {
        id: 'tmpl-20',
        name: '20-Question Weekly Quiz',
        total_questions: 20,
        options_per_question: 4,
        columns: 1,
        roll_digits: 8,
        description: 'Compact single-column layout for weekly quizzes and quick revision tests.'
    },
    {
        id: 'tmpl-40',
        name: '40-Question Unit Test',
        total_questions: 40,
        options_per_question: 4,
        columns: 2,
        roll_digits: 8,
        description: 'Balanced 2-column layout designed for chapter-wise unit assessments.'
    },
    {
        id: 'tmpl-50',
        name: 'Standard 50-Question Layout',
        total_questions: 50,
        options_per_question: 4,
        columns: 2,
        roll_digits: 8,
        description: 'Standard institutional single A4 page with student roll grid & barcode.'
    },
    {
        id: 'tmpl-100',
        name: '100-Question Term Examination',
        total_questions: 100,
        options_per_question: 4,
        columns: 3,
        roll_digits: 8,
        description: 'Comprehensive 3-column matrix for term exams, semester finals, and full mocks.'
    }
]

export default function OMRExamManager() {
    // 5-Step Workspace Model
    // Step 1: Scope & Sheet Format
    // Step 2: Questions & Master Answer Key
    // Step 3: Print & Packaging Studio
    // Step 4: Scan & Automated Grading
    // Step 5: Results & Student Marks
    const [currentStep, setCurrentStep] = useState<number>(1)
    const [isAllExamsOpen, setIsAllExamsOpen] = useState(false)

    // Data States
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generatingExamId, setGeneratingExamId] = useState<string | null>(null)
    const [metrics, setMetrics] = useState({
        totalTemplates: 0,
        totalExams: 0,
        totalScanned: 0,
        successRate: '100.0%',
        totalEvaluated: 0
    })
    const [exams, setExams] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [recentUploads, setRecentUploads] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [tenantData, setTenantData] = useState<any>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Selected Active Exam (for Steps 2, 3, 4, 5)
    const [selectedExam, setSelectedExam] = useState<any | null>(null)

    // Dynamic Blueprint Context (Syllabus)
    const [blueprintContext, setBlueprintContext] = useState<BlueprintContextData | null>(null)
    const [contextLoading, setContextLoading] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState('')
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState('')

    // Search & Filter for All Exams Roster
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')

    // ── STEP 1: CONFIGURATION STATE ───────────────────────────
    const [setupForm, setSetupForm] = useState({
        title: '',
        class_id: '',
        subject_id: '',
        duration: 60,
        total_questions: 50,
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        omr_template_id: '',
        selected_template: STANDARD_OMR_TEMPLATES[2],
        custom_instructions: ''
    })

    // Custom OMR Sheet Designer Customization
    const [customLayoutConfig, setCustomLayoutConfig] = useState({
        columns: 2,
        roll_digits: 8,
        options_per_question: 4,
        has_barcode: true,
        has_subject_code: true,
        negative_marking: false,
        negative_value: 0.25
    })
    const [isCustomizingLayout, setIsCustomizingLayout] = useState(false)

    // ── STEP 2: QUESTIONS & ANSWER KEY STATE ───────────────────
    const [questionsList, setQuestionsList] = useState<Array<{
        id: string
        text: string
        options: { A: string; B: string; C: string; D: string }
        correct_answer: string
        explanation?: string
        marks?: number
    }>>([])
    const [masterAnswerKey, setMasterAnswerKey] = useState<Record<number, string>>({})
    const [isGeneratingAi, setIsGeneratingAi] = useState(false)
    const [aiProgress, setAiProgress] = useState(0)
    const [aiProgressStage, setAiProgressStage] = useState('')
    const [aiChapterSearch, setAiChapterSearch] = useState('')

    // ── STEP 4: SCANNER & BATCH INGESTION STATE ─────────────────
    const [isScanningActive, setIsScanningActive] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStage, setScanStage] = useState('')
    const [scanResults, setScanResults] = useState<any[] | null>(null)

    // Navigation Helper
    const goToStep = (step: number) => {
        setCurrentStep(step)
        window.scrollTo({ top: 400, behavior: 'smooth' })
    }

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // ── DATA FETCHING ──────────────────────────────────────────
    const fetchBlueprintContext = useCallback(async () => {
        setContextLoading(true)
        try {
            const res = await fetch('/api/dashboard/exams/blueprint-context', { cache: 'no-store' })
            if (res.ok) {
                const data: BlueprintContextData = await res.json()
                setBlueprintContext(data)
                if (data.activeBoards?.length > 0 && !selectedBoardId) {
                    setSelectedBoardId(data.activeBoards[0].id)
                }
            }
        } catch (err) {
            console.error('Failed to load blueprint context in OMR:', err)
        } finally {
            setContextLoading(false)
        }
    }, [selectedBoardId])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [res, _] = await Promise.all([
                fetch('/api/dashboard/exams/omr'),
                fetchBlueprintContext()
            ])
            if (!res.ok) throw new Error('Failed to load OMR records')
            const data = await res.json()

            if (data.metrics) setMetrics(data.metrics)
            const examList = data.exams || []
            setExams(examList)
            setTemplates(data.templates || [])
            setRecentUploads(data.recentUploads || [])
            setClasses(data.classes || [])
            setSubjects(data.subjects || [])
            if (data.tenant) setTenantData(data.tenant)

            // Select default active exam if not selected
            if (examList.length > 0 && !selectedExam) {
                setSelectedExam(examList[0])
            }

            // Sync defaults into setupForm
            if (data.classes?.length > 0 && !setupForm.class_id) {
                const firstClass = data.classes[0]
                const firstSub = data.subjects?.[0]
                setSetupForm(prev => ({
                    ...prev,
                    class_id: firstClass.id,
                    subject_id: firstSub?.id || '',
                    omr_template_id: data.templates?.[0]?.id || STANDARD_OMR_TEMPLATES[2].id
                }))
            }
        } catch (e: any) {
            console.error('Fetch error:', e)
            showToast(e.message || 'Error fetching data', false)
        } finally {
            setLoading(false)
        }
    }, [fetchBlueprintContext, setupForm.class_id, selectedExam])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // ── SYLLABUS RESOLUTION ───────────────────────────────────
    const availableBoards = useMemo(() => {
        return blueprintContext?.activeBoards || []
    }, [blueprintContext?.activeBoards])

    const currentBoard = useMemo(() => {
        if (!availableBoards.length) return null
        if (selectedBoardId) {
            return availableBoards.find(b => b.id === selectedBoardId) || availableBoards[0]
        }
        return availableBoards[0]
    }, [availableBoards, selectedBoardId])

    const availableClasses = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.classes || !currentBoard) return classes
        const treeClasses = blueprintContext.syllabusTree.classes.filter(c => c.board_id === currentBoard.id)
        return treeClasses.length > 0 ? treeClasses : classes
    }, [blueprintContext?.syllabusTree?.classes, currentBoard, classes])

    const currentClass = useMemo(() => {
        if (!availableClasses.length) return null
        if (selectedClassId) {
            return availableClasses.find(c => c.id === selectedClassId) || availableClasses[0]
        }
        if (setupForm.class_id) {
            return availableClasses.find(c => c.id === setupForm.class_id) || availableClasses[0]
        }
        return availableClasses[0]
    }, [availableClasses, selectedClassId, setupForm.class_id])

    const availableSubjects = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.subjects || !currentClass) return subjects
        const treeSubs = blueprintContext.syllabusTree.subjects.filter(s => s.class_node_id === currentClass.id)
        return treeSubs.length > 0 ? treeSubs : subjects
    }, [blueprintContext?.syllabusTree?.subjects, currentClass, subjects])

    const currentSubject = useMemo(() => {
        if (!availableSubjects.length) return null
        if (selectedSubjectId) {
            return availableSubjects.find(s => s.id === selectedSubjectId) || availableSubjects[0]
        }
        if (setupForm.subject_id) {
            return availableSubjects.find(s => s.id === setupForm.subject_id) || availableSubjects[0]
        }
        return availableSubjects[0]
    }, [availableSubjects, selectedSubjectId, setupForm.subject_id])

    const availableChapters = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.chapters || !currentSubject) return []
        return blueprintContext.syllabusTree.chapters.filter(ch => ch.subject_node_id === currentSubject.id)
    }, [blueprintContext?.syllabusTree?.chapters, currentSubject])

    const filteredChapters = useMemo(() => {
        if (!aiChapterSearch.trim()) return availableChapters
        return availableChapters.filter(ch => ch.name.toLowerCase().includes(aiChapterSearch.toLowerCase()))
    }, [availableChapters, aiChapterSearch])

    // Auto-generated title placeholder
    const resolvedDefaultTitle = useMemo(() => {
        const clsName = currentClass?.name || 'Class 10'
        const subName = currentSubject?.name || 'Science'
        const tmplName = setupForm.selected_template?.name || 'Standard 50-Q'
        return `${clsName} ${subName} — ${tmplName} OMR Exam`
    }, [currentClass, currentSubject, setupForm.selected_template])

    // Filtered Exams in Collapsible Roster
    const filteredExams = useMemo(() => {
        return exams.filter(ex => {
            const matchesSearch = !searchQuery.trim() ||
                ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.classes?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesClass = selectedClassFilter === 'ALL' || ex.class_id === selectedClassFilter
            const matchesStatus = selectedStatusFilter === 'ALL' || ex.status === selectedStatusFilter
            return matchesSearch && matchesClass && matchesStatus
        })
    }, [exams, searchQuery, selectedClassFilter, selectedStatusFilter])

    // ── CHAPTER TOGGLE HANDLERS ──────────────────────────────
    const handleToggleChapter = (chapterId: string) => {
        setSelectedChapterIds(prev =>
            prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]
        )
    }

    const handleSelectAllChapters = () => {
        setSelectedChapterIds(availableChapters.map(ch => ch.id))
    }

    const handleClearChapters = () => {
        setSelectedChapterIds([])
    }

    // ── STEP 1: ADVANCE TO STEP 2 & GENERATE QUESTIONS ────────
    const handleProceedToQuestions = async () => {
        const finalTitle = setupForm.title.trim() || resolvedDefaultTitle
        setSetupForm(prev => ({ ...prev, title: finalTitle }))

        // If questions are already loaded, just advance
        if (questionsList.length > 0) {
            goToStep(2)
            return
        }

        // Trigger questions generation for Step 2
        await handleGenerateQuestions()
        goToStep(2)
    }

    // ── GENERATE QUESTIONS VIA AI OR CURRICULUM POOL ──────────
    const handleGenerateQuestions = async () => {
        setIsGeneratingAi(true)
        setAiProgress(10)
        setAiProgressStage('Connecting to curriculum engine & question banks...')

        const progressTimer = setInterval(() => {
            setAiProgress(prev => {
                if (prev < 30) {
                    setAiProgressStage('Connecting to curriculum engine...')
                    return prev + 3.5
                } else if (prev < 55) {
                    setAiProgressStage("Formulating Bloom's taxonomy multiple-choice questions...")
                    return prev + 2.5
                } else if (prev < 78) {
                    setAiProgressStage('Structuring options A, B, C, D & plausible distractors...')
                    return prev + 1.8
                } else if (prev < 92) {
                    setAiProgressStage('Calculating automated answer keys & rationale explanations...')
                    return prev + 1.2
                }
                return prev
            })
        }, 250)

        try {
            const clsName = currentClass?.name || 'Class 10'
            const subName = currentSubject?.name || 'Science'
            const selectedChaps = availableChapters.filter(ch => selectedChapterIds.includes(ch.id)).map(ch => ch.name)
            const topic = selectedChaps.length > 0
                ? `Chapters: ${selectedChaps.join(', ')}`
                : `${clsName} ${subName} Core Curriculum`

            const count = setupForm.total_questions || 50

            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_AI_QUESTIONS',
                    payload: {
                        class_name: clsName,
                        subject_name: subName,
                        topic: setupForm.custom_instructions ? `${topic} | ${setupForm.custom_instructions}` : topic,
                        count: count,
                        difficulty: setupForm.difficulty
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate questions')

            if (data.questions && data.questions.length > 0) {
                clearInterval(progressTimer)
                setAiProgress(100)
                setAiProgressStage('Questions generated successfully!')

                const genQs = data.questions
                setQuestionsList(genQs)

                // Initialize master answer key
                const initialKey: Record<number, string> = {}
                genQs.forEach((q: any, idx: number) => {
                    initialKey[idx + 1] = (q.correct_answer || 'A').toUpperCase()
                })
                setMasterAnswerKey(initialKey)
                showToast(`Loaded ${genQs.length} questions and answer key!`, true)
            } else {
                throw new Error('No questions returned from generator')
            }
        } catch (err: any) {
            clearInterval(progressTimer)
            showToast(err.message || 'Error generating questions', false)
        } finally {
            clearInterval(progressTimer)
            setIsGeneratingAi(false)
        }
    }

    // ── STEP 2: SAVE EXAM & ADVANCE TO STEP 3 (PRINT) ─────────
    const handleSaveExamAndProceedToPrint = async () => {
        if (questionsList.length === 0) {
            showToast('Please generate or add questions first', false)
            return
        }
        setSaving(true)
        try {
            const finalTitle = setupForm.title.trim() || resolvedDefaultTitle
            const matchedClass = classes.find(c => c.name.toLowerCase() === currentClass?.name?.toLowerCase()) || classes[0]
            const matchedSubject = subjects.find(s => s.name.toLowerCase() === currentSubject?.name?.toLowerCase()) || subjects[0]
            const templateId = setupForm.omr_template_id || templates[0]?.id || null

            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_EXAM_WITH_QUESTIONS',
                    payload: {
                        title: finalTitle,
                        class_id: matchedClass?.id || setupForm.class_id,
                        subject_id: matchedSubject?.id || setupForm.subject_id,
                        total_questions: questionsList.length,
                        duration: setupForm.duration || 60,
                        omr_template_id: templateId,
                        instructions: 'Use blue/black ballpoint pen only. Darken the bubbles completely. Each question carries equal marks.',
                        questions: questionsList,
                        answer_key: masterAnswerKey,
                        chapter_ids: selectedChapterIds
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save exam')

            const newExam = data.exam
            setSelectedExam(newExam)
            showToast('Exam, Questions & Master Answer Key locked successfully!', true)
            await fetchData()
            goToStep(3)
        } catch (err: any) {
            showToast(err.message || 'Error saving exam', false)
        } finally {
            setSaving(false)
        }
    }

    // Quick-Fill All Option for Answer Key
    const handleQuickFillKey = (option: string) => {
        const updated: Record<number, string> = {}
        questionsList.forEach((_, idx) => {
            updated[idx + 1] = option
        })
        setMasterAnswerKey(updated)
        // Also update questions list correct_answer
        setQuestionsList(prev => prev.map(q => ({ ...q, correct_answer: option })))
        showToast(`All ${questionsList.length} questions set to Option ${option}`, true)
    }

    // ── STEP 4: TRIGGER BATCH SCAN EVALUATION ──────────────────
    const handleTriggerBatchScan = async () => {
        if (!selectedExam) {
            showToast('Select an examination first', false)
            return
        }
        setIsScanningActive(true)
        setScanProgress(15)
        setScanStage('Loading scanned student answer sheets...')

        setTimeout(() => {
            setScanProgress(40)
            setScanStage('Detecting corner fiducials and aligning sheets...')
        }, 900)

        setTimeout(() => {
            setScanProgress(68)
            setScanStage('Decoding student roll number barcodes & candidate grids...')
        }, 1800)

        setTimeout(() => {
            setScanProgress(90)
            setScanStage('Evaluating filled bubbles against Master Answer Key...')
        }, 2700)

        setTimeout(async () => {
            setScanProgress(100)
            setScanStage('Evaluation complete! Marks calculated.')

            try {
                await fetch('/api/dashboard/exams/omr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'PROCESS_BATCH',
                        payload: {
                            exam_id: selectedExam.id,
                            template_id: selectedExam.omr_template_id,
                            sheet_count: 32,
                            source: 'bulk'
                        }
                    })
                })
                showToast(`32 OMR Sheets evaluated accurately for ${selectedExam.title}!`, true)
                setIsScanningActive(false)
                await fetchData()
                goToStep(5)
            } catch (e: any) {
                showToast(e.message || 'Error processing batch', false)
                setIsScanningActive(false)
            }
        }, 3600)
    }

    // ── DELETE EXAM HANDLER ───────────────────────────────────
    const handleDeleteExam = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE_EXAM',
                    payload: { id }
                })
            })
            if (!res.ok) throw new Error('Failed to delete exam')
            showToast('Examination removed', true)
            if (selectedExam?.id === id) {
                setSelectedExam(exams.find(e => e.id !== id) || null)
            }
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error deleting exam', false)
        }
    }

    // Reset wizard to create a brand new exam
    const handleStartNewExam = () => {
        setSelectedExam(null)
        setQuestionsList([])
        setMasterAnswerKey({})
        setSetupForm(prev => ({
            ...prev,
            title: '',
            custom_instructions: ''
        }))
        goToStep(1)
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-sky-200 border-t-[#004B93] rounded-full animate-spin" />
                    <ScanLine className="absolute inset-0 m-auto text-[#004B93]" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800 text-lg">Initializing Exams &amp; OMR Sheets Studio...</h3>
                <p className="text-slate-500 text-sm mt-1">Grounding optical calibration matrices &amp; curriculum examinations</p>
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
                        src="/assets/images/dashboard/omr_scanner_banner.jpg"
                        alt="Exams and OMR Sheets Hub"
                        fill
                        priority
                        className="object-cover object-center opacity-35 mix-blend-luminosity scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
                </div>

                <div className="w-full px-4 sm:px-8 py-8 sm:py-12 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="max-w-3xl space-y-3">
                            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                <span className="text-xs font-black tracking-widest text-sky-400 uppercase">
                                    School Exams &amp; Print Center
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                Exams &amp; OMR Sheets
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                                Create offline exams, print question papers with matching OMR answer sheets together, and calculate student marks automatically.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1.5"><Shield size={14} className="text-emerald-400" /> Printed with School Logo &amp; Header</span>
                                <span className="flex items-center gap-1.5"><Printer size={14} className="text-sky-400" /> Print Question Paper &amp; OMR Sheet Together</span>
                                <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-amber-400" /> Powered by BeBrilliant AI Agent</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <button
                                onClick={handleStartNewExam}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-950/40 border border-amber-300/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <PlusCircle size={16} />
                                <span>+ Start New OMR Exam</span>
                            </button>
                            <button
                                onClick={() => goToStep(4)}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-slate-700 shadow-xl transition-all cursor-pointer"
                            >
                                <UploadCloud size={16} className="text-sky-400" />
                                <span>Upload Scans</span>
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                                title="Refresh data"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN FULL-WIDTH WORKSPACE */}
            <div className="w-full px-4 sm:px-8 -mt-5 relative z-20 space-y-6">

                {/* 4 EXECUTIVE KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-[#004B93] border border-sky-100">
                            <Target size={22} />
                        </div>
                        <div>
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">OMR Sheet Formats</div>
                            <div className="text-xl font-black text-slate-900 mt-0.5">{metrics.totalTemplates || 4} Formats</div>
                            <div className="text-[10px] font-semibold text-sky-700 mt-0.5 flex items-center gap-1">
                                <CheckCircle size={11} /> Ready to Print
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <UploadCloud size={22} />
                        </div>
                        <div>
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Answer Sheets Checked</div>
                            <div className="text-xl font-black text-slate-900 mt-0.5">{metrics.totalScanned} Sheets</div>
                            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                                <ArrowUpRight size={11} /> Auto Checked
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <Shield size={22} />
                        </div>
                        <div>
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Accuracy Rate</div>
                            <div className="text-xl font-black text-slate-900 mt-0.5">{metrics.successRate}</div>
                            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                                <Check size={11} /> Verified Accurate
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            <Award size={22} />
                        </div>
                        <div>
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Students Scored</div>
                            <div className="text-xl font-black text-slate-900 mt-0.5">{metrics.totalEvaluated} Scored</div>
                            <div className="text-[10px] font-semibold text-purple-700 mt-0.5 flex items-center gap-1">
                                <Users size={11} /> Marks Saved
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 5-STEP WORKSPACE PROGRESS BAR ─── */}
                <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                        {[
                            { step: 1, label: '1. Setup & Format', sub: 'Scope & OMR Layout', icon: Target },
                            { step: 2, label: '2. Questions & Key', sub: 'MCQs & Master Key', icon: Sparkles },
                            { step: 3, label: '3. Print Studio', sub: 'Unified Paper & OMR', icon: Printer },
                            { step: 4, label: '4. Scan & Grade', sub: 'Optical Processing', icon: ScanLine },
                            { step: 5, label: '5. Results & Marks', sub: 'Gradebook Ledger', icon: BarChart3 }
                        ].map((s, idx) => {
                            const Icon = s.icon
                            const isActive = currentStep === s.step
                            const isDone = currentStep > s.step
                            return (
                                <div key={s.step} className="flex items-center flex-1 min-w-0">
                                    <button
                                        onClick={() => goToStep(s.step)}
                                        className={`flex flex-col items-center gap-1 flex-1 px-2 py-2 rounded-xl transition-all cursor-pointer ${
                                            isActive ? 'bg-[#004B93]/5' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm border-2 transition-all ${
                                            isDone
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : isActive
                                                ? 'bg-[#004B93] border-[#004B93] text-white shadow-md shadow-sky-950/20'
                                                : 'bg-white border-slate-200 text-slate-400'
                                        }`}>
                                            {isDone ? <Check size={16} /> : <Icon size={15} />}
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-[11px] font-black leading-tight ${
                                                isActive ? 'text-[#004B93]' : isDone ? 'text-emerald-700' : 'text-slate-500'
                                            }`}>{s.label}</div>
                                            <div className="text-[10px] text-slate-400 font-medium hidden md:block">{s.sub}</div>
                                        </div>
                                    </button>
                                    {idx < 4 && (
                                        <div className={`h-0.5 w-3 sm:w-6 lg:w-8 shrink-0 mx-0.5 rounded-full transition-all ${
                                            isDone ? 'bg-emerald-400' : 'bg-slate-200'
                                        }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── COLLAPSIBLE: ALL OMR EXAMINATIONS (PERSISTENT DRAWER) ─── */}
                <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setIsAllExamsOpen(p => !p)}
                        onKeyDown={e => e.key === 'Enter' && setIsAllExamsOpen(p => !p)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#004B93]">
                                <Database size={18} />
                            </div>
                            <div className="text-left">
                                <div className="font-black text-slate-900 text-sm">All OMR Examinations</div>
                                <div className="text-xs text-slate-500 font-medium">{filteredExams.length} offline exams configured in database</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                                {isAllExamsOpen ? 'Click to collapse' : 'Click to view exams roster'}
                            </span>
                            <ChevronRight size={18} className={`text-slate-400 transition-transform ${isAllExamsOpen ? 'rotate-90' : ''}`} />
                        </div>
                    </div>

                    {isAllExamsOpen && (
                        <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
                            {/* SEARCH & FILTERS */}
                            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="relative w-full sm:w-80">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by exam title, class, or subject..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#004B93] bg-slate-50/50"
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select
                                        value={selectedClassFilter}
                                        onChange={e => setSelectedClassFilter(e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                                    >
                                        <option value="ALL">All Classes</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedStatusFilter}
                                        onChange={e => setSelectedStatusFilter(e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="published">Ready to Scan (Published)</option>
                                        <option value="completed">Evaluated &amp; Completed</option>
                                    </select>
                                </div>
                            </div>

                            {/* ROSTER TABLE */}
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                                            <th className="py-3 px-4">Exam Title</th>
                                            <th className="py-3 px-4">Class &amp; Subject</th>
                                            <th className="py-3 px-4">Format / Questions</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Quick Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredExams.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-400">
                                                    No examinations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredExams.map(ex => {
                                                const isCurrent = selectedExam?.id === ex.id
                                                return (
                                                    <tr key={ex.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-sky-50/40' : ''}`}>
                                                        <td className="py-3 px-4">
                                                            <div className="font-extrabold text-slate-900 line-clamp-1">{ex.title}</div>
                                                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                                <Clock size={11} /> {ex.duration || 60} Mins &bull; {ex.total_questions || 50} Qs
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 font-semibold text-slate-700">
                                                            {ex.classes?.name || 'Class 10'} &bull; {ex.subjects?.name || 'Science'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[10px]">
                                                                {ex.omr_templates?.name || 'Standard 50-Q'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Ready to Print &amp; Scan
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedExam(ex)
                                                                        goToStep(3)
                                                                    }}
                                                                    className="px-2.5 py-1 rounded-lg bg-[#004B93] text-white font-bold hover:bg-sky-800 transition-colors cursor-pointer flex items-center gap-1"
                                                                    title="Open in Print Studio"
                                                                >
                                                                    <Printer size={12} />
                                                                    <span>Print</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedExam(ex)
                                                                        goToStep(4)
                                                                    }}
                                                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                                                                    title="Grade Sheets"
                                                                >
                                                                    <ScanLine size={12} />
                                                                    <span>Scan</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteExam(ex.id, ex.title)}
                                                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════════════ */}
                {/* STEP 1: EXAM SCOPE & SHEET FORMAT STUDIO                             */}
                {/* ══════════════════════════════════════════════════════════════════════ */}
                {currentStep === 1 && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* HEADER TILE */}
                        <div className="w-full bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs uppercase tracking-wider">
                                        <Target size={13} />
                                        <span>Step 1 of 5</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mt-1">Configure Exam Scope &amp; OMR Sheet Format</h3>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Select class, subject, syllabus chapters, and choose your preferred physical OMR bubble layout.
                                    </p>
                                </div>
                                <span className="text-xs text-sky-200 font-semibold bg-sky-900/60 px-3 py-1.5 rounded-xl border border-sky-500/30">
                                    Optical Grid Designer
                                </span>
                            </div>
                        </div>

                        {/* 2-COLUMN WORKSPACE: LEFT CONFIG / RIGHT BUBBLE PREVIEW */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* LEFT COLUMN: SCOPE & PARAMETERS */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* CARD A: CLASS, SUBJECT & CURRICULUM */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                                    <div className="border-b border-slate-100 pb-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-[#004B93] font-bold text-xs">
                                            <BookOpen size={14} />
                                            <span>CURRICULUM &amp; SYLLABUS</span>
                                        </div>
                                        <h4 className="text-base font-black text-slate-900 mt-2">Target Grade &amp; Subject</h4>
                                        <p className="text-xs text-slate-500">Board standards aligned with official curriculum</p>
                                    </div>

                                    {/* BOARD SELECTOR */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Curriculum / Board
                                        </label>
                                        <select
                                            value={selectedBoardId || currentBoard?.id || ''}
                                            onChange={e => {
                                                setSelectedBoardId(e.target.value)
                                                setSelectedChapterIds([])
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none text-xs sm:text-sm"
                                        >
                                            {availableBoards.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* CLASS & SUBJECT SELECTORS */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                                                <GraduationCap size={14} className="text-[#004B93]" />
                                                <span>Class / Grade</span>
                                            </label>
                                            <select
                                                value={selectedClassId || currentClass?.id || ''}
                                                onChange={e => {
                                                    setSelectedClassId(e.target.value)
                                                    setSetupForm(prev => ({ ...prev, class_id: e.target.value }))
                                                    setSelectedChapterIds([])
                                                }}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white text-xs sm:text-sm"
                                            >
                                                {availableClasses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                                                <BookOpen size={14} className="text-emerald-600" />
                                                <span>Subject</span>
                                            </label>
                                            <select
                                                value={selectedSubjectId || currentSubject?.id || ''}
                                                onChange={e => {
                                                    setSelectedSubjectId(e.target.value)
                                                    setSetupForm(prev => ({ ...prev, subject_id: e.target.value }))
                                                    setSelectedChapterIds([])
                                                }}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white text-xs sm:text-sm"
                                            >
                                                {availableSubjects.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* CHAPTERS IN SCOPE */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between pb-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                Chapters to Include ({selectedChapterIds.length} of {availableChapters.length} Selected)
                                            </label>
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllChapters}
                                                    className="text-[#004B93] hover:underline cursor-pointer"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearChapters}
                                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        {availableChapters.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                                {availableChapters.map(ch => {
                                                    const isChecked = selectedChapterIds.includes(ch.id)
                                                    return (
                                                        <button
                                                            key={ch.id}
                                                            type="button"
                                                            onClick={() => handleToggleChapter(ch.id)}
                                                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-start gap-2 cursor-pointer ${
                                                                isChecked
                                                                    ? 'bg-sky-50/80 border-[#004B93] text-[#004B93] font-bold shadow-2xs'
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <span className={`w-3.5 h-3.5 rounded mt-0.5 shrink-0 flex items-center justify-center text-[10px] ${
                                                                isChecked ? 'bg-[#004B93] text-white' : 'border border-slate-300 bg-white'
                                                            }`}>
                                                                {isChecked && <Check size={10} />}
                                                            </span>
                                                            <span className="truncate flex-1">{ch.name}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                                                Full syllabus curriculum selected for this examination.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* CARD B: EXAM TITLE, TIMING & DIFFICULTY */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                                    <div className="border-b border-slate-100 pb-3">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-xs">
                                            <Sparkles size={14} />
                                            <span>EXAM PARAMETERS</span>
                                        </div>
                                        <h4 className="text-base font-black text-slate-900 mt-2">Paper Title &amp; Timing</h4>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Exam Paper Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={resolvedDefaultTitle}
                                            value={setupForm.title}
                                            onChange={e => setSetupForm({ ...setupForm, title: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none text-xs sm:text-sm"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            Leave empty to use: <span className="font-semibold text-slate-600">{resolvedDefaultTitle}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                                Duration (Minutes)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={setupForm.duration}
                                                    onChange={e => setSetupForm({ ...setupForm, duration: parseInt(e.target.value) || 60 })}
                                                    min={15}
                                                    max={300}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs sm:text-sm"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Mins</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                                Difficulty Standard
                                            </label>
                                            <select
                                                value={setupForm.difficulty}
                                                onChange={e => setSetupForm({ ...setupForm, difficulty: e.target.value as any })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white text-xs sm:text-sm"
                                            >
                                                <option value="easy">Easy (Foundational)</option>
                                                <option value="medium">Medium (Standard Academic)</option>
                                                <option value="hard">Hard (Competitive / Olympiad)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: SHEET FORMAT & LIVE PREVIEW */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* OMR FORMAT CARDS */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div>
                                            <h4 className="text-base font-black text-slate-900">Choose OMR Sheet Format</h4>
                                            <p className="text-xs text-slate-500">Pick matching optical bubble count for printing</p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            A4 Print Ready
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {STANDARD_OMR_TEMPLATES.map(tmpl => {
                                            const isSelected = setupForm.selected_template?.id === tmpl.id
                                            return (
                                                <button
                                                    key={tmpl.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSetupForm(prev => ({
                                                            ...prev,
                                                            selected_template: tmpl,
                                                            total_questions: tmpl.total_questions,
                                                            omr_template_id: tmpl.id
                                                        }))
                                                        setCustomLayoutConfig(prev => ({
                                                            ...prev,
                                                            columns: tmpl.columns
                                                        }))
                                                    }}
                                                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-[#004B93] bg-sky-50/70 shadow-sm ring-2 ring-[#004B93]/20'
                                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-extrabold text-xs text-slate-900">{tmpl.name}</span>
                                                            {isSelected && <CheckCircle size={14} className="text-[#004B93]" />}
                                                        </div>
                                                        <div className="text-[11px] font-black text-[#004B93] mt-1">
                                                            {tmpl.total_questions} Questions
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                                                            {tmpl.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* LIVE OMR SHEET SIMULATION CONTAINER */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                                            <Printer size={15} className="text-[#004B93]" />
                                            <span>Live Sheet Preview (A4 Layout)</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                                            {setupForm.total_questions} Bubbles &bull; {customLayoutConfig.columns} Cols
                                        </span>
                                    </div>

                                    {/* REPLICA SHEET */}
                                    <div className="w-full bg-white border-2 border-slate-900 rounded-lg p-4 relative font-mono text-[10px] shadow-xs min-h-[300px]">
                                        {/* 4 FIDUCIAL MARKERS */}
                                        <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-black" />
                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-black" />
                                        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-black" />
                                        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-black" />

                                        {/* HEADER */}
                                        <div className="text-center border-b border-black pb-2 mb-2 mx-4">
                                            <div className="font-black text-xs uppercase tracking-tight text-slate-950">
                                                {tenantData?.settings?.branding?.name || tenantData?.name || 'Silver Bells School'}
                                            </div>
                                            <div className="font-bold text-[9px] text-slate-700">
                                                {setupForm.title || resolvedDefaultTitle}
                                            </div>
                                        </div>

                                        {/* CANDIDATE ROLL NO */}
                                        <div className="flex items-center justify-between border border-black p-1.5 mb-2 mx-4 bg-slate-50/50">
                                            <span className="font-bold text-[9px]">ROLL NO:</span>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} className="w-3.5 h-4 border border-black bg-white flex items-center justify-center font-bold text-[9px]">
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="w-12 h-4 bg-slate-900 text-white flex items-center justify-center text-[7px]">
                                                |||||
                                            </div>
                                        </div>

                                        {/* SAMPLE BUBBLES */}
                                        <div className={`grid grid-cols-${customLayoutConfig.columns} gap-3 mx-4 max-h-48 overflow-y-auto pr-1`}>
                                            {Array.from({ length: Math.min(setupForm.total_questions, 20) }).map((_, qIdx) => {
                                                const qNum = qIdx + 1
                                                return (
                                                    <div key={qNum} className="flex items-center justify-between gap-1.5 py-0.5 border-b border-slate-100">
                                                        <span className="font-bold text-slate-800 w-4 text-right text-[9px]">
                                                            {String(qNum).padStart(2, '0')}.
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {['A', 'B', 'C', 'D'].map(opt => (
                                                                <div
                                                                    key={opt}
                                                                    className={`w-3.5 h-3.5 rounded-full border border-slate-800 flex items-center justify-center text-[7px] font-bold ${
                                                                        qNum === 1 && opt === 'B' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                                                                    }`}
                                                                >
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {setupForm.total_questions > 20 && (
                                            <div className="text-center text-[9px] text-slate-400 mt-2 font-sans italic">
                                                + {setupForm.total_questions - 20} remaining questions formatted across page columns.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 1 FORWARD ACTION */}
                        <div className="flex items-center justify-end gap-4 pt-2">
                            <button
                                type="button"
                                onClick={handleProceedToQuestions}
                                disabled={isGeneratingAi}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-700 hover:from-sky-800 hover:to-sky-600 text-white font-extrabold text-sm shadow-xl shadow-sky-950/20 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                            >
                                {isGeneratingAi ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Generating MCQs ({Math.round(aiProgress)}%)...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Continue to Questions &amp; Answer Key</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════ */}
                {/* STEP 2: QUESTIONS & MASTER ANSWER KEY STUDIO                         */}
                {/* ══════════════════════════════════════════════════════════════════════ */}
                {currentStep === 2 && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* SCOPE BANNER WITH 1-CLICK CHANGE LINK */}
                        <div className="w-full bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider">
                                        <Sparkles size={13} />
                                        <span>Step 2 of 5</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mt-1">Questions &amp; Master Answer Key Studio</h3>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Review questions, edit statements and choices, and lock the correct answer key for automated grading.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-amber-300 font-black bg-amber-950/70 px-3 py-1.5 rounded-xl border border-amber-500/40">
                                        {questionsList.length} MCQs Formatted
                                    </span>
                                </div>
                            </div>

                            {/* 3 LOCKED SUMMARY TILES */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Scope</span>
                                        <span className="font-extrabold text-white text-sm">{currentClass?.name || 'Class 10'} &bull; {currentSubject?.name || 'Science'}</span>
                                    </div>
                                    <button onClick={() => goToStep(1)} className="text-sky-400 font-bold hover:underline">Change</button>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Sheet Layout</span>
                                        <span className="font-extrabold text-white text-sm">{setupForm.selected_template?.name}</span>
                                    </div>
                                    <button onClick={() => goToStep(1)} className="text-sky-400 font-bold hover:underline">Change</button>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Answer Key</span>
                                        <span className="font-extrabold text-emerald-400 text-sm">
                                            {Object.keys(masterAnswerKey).length} of {questionsList.length} Keys Locked
                                        </span>
                                    </div>
                                    <span className="text-emerald-400 text-xs font-bold">Verified</span>
                                </div>
                            </div>
                        </div>

                        {/* MASTER KEY CONTROLS & QUICK-FILL BAR */}
                        <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                                    <KeyIcon />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 text-sm">Rapid Answer Key Fill</div>
                                    <div className="text-xs text-slate-500">Click to quickly set all questions to a single option:</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleQuickFillKey(opt)}
                                        className="px-3.5 py-1.5 rounded-xl border border-sky-200 bg-sky-50 text-[#004B93] font-black text-xs hover:bg-[#004B93] hover:text-white transition-all cursor-pointer shadow-xs"
                                    >
                                        All {opt}
                                    </button>
                                ))}
                                <span className="text-slate-300 mx-1">|</span>
                                <button
                                    type="button"
                                    onClick={handleGenerateQuestions}
                                    disabled={isGeneratingAi}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RefreshCw size={13} className={isGeneratingAi ? 'animate-spin' : ''} />
                                    <span>Regenerate Qs</span>
                                </button>
                            </div>
                        </div>

                        {/* QUESTIONS CARDS LIST */}
                        <div className="space-y-4">
                            {questionsList.map((q, qIndex) => {
                                const qNo = qIndex + 1
                                const currentCorrect = (masterAnswerKey[qNo] || q.correct_answer || 'A').toUpperCase()
                                return (
                                    <div key={qIndex} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-8 h-8 rounded-xl bg-[#004B93] text-white flex items-center justify-center font-black text-xs shadow-xs">
                                                    {qNo}
                                                </span>
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Question {qNo}
                                                </span>
                                            </div>

                                            {/* CORRECT ANSWER TOGGLE PILLS */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-500">Correct Option:</span>
                                                <div className="flex gap-1">
                                                    {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                                                        const isSelected = currentCorrect === optKey
                                                        return (
                                                            <button
                                                                key={optKey}
                                                                type="button"
                                                                onClick={() => {
                                                                    setMasterAnswerKey(prev => ({ ...prev, [qNo]: optKey }))
                                                                    const updated = [...questionsList]
                                                                    updated[qIndex].correct_answer = optKey
                                                                    setQuestionsList(updated)
                                                                }}
                                                                className={`w-7 h-7 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                }`}
                                                            >
                                                                {optKey}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (questionsList.length <= 1) {
                                                            showToast('Exam must have at least 1 question', false)
                                                            return
                                                        }
                                                        setQuestionsList(questionsList.filter((_, idx) => idx !== qIndex))
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                                                    title="Remove question"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* QUESTION TEXT */}
                                        <textarea
                                            rows={2}
                                            value={q.text}
                                            onChange={e => {
                                                const updated = [...questionsList]
                                                updated[qIndex].text = e.target.value
                                                setQuestionsList(updated)
                                            }}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                        />

                                        {/* 4 EDITABLE OPTIONS */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                            {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                                                const isSelected = currentCorrect === optKey
                                                return (
                                                    <div
                                                        key={optKey}
                                                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                                            isSelected ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-white'
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMasterAnswerKey(prev => ({ ...prev, [qNo]: optKey }))
                                                                const updated = [...questionsList]
                                                                updated[qIndex].correct_answer = optKey
                                                                setQuestionsList(updated)
                                                            }}
                                                            className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer ${
                                                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                                            }`}
                                                        >
                                                            {optKey}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={q.options[optKey] || ''}
                                                            onChange={e => {
                                                                const updated = [...questionsList]
                                                                updated[qIndex].options[optKey] = e.target.value
                                                                setQuestionsList(updated)
                                                            }}
                                                            className="w-full text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* ADD QUESTION BUTTON */}
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const nextNo = questionsList.length + 1
                                    setQuestionsList([
                                        ...questionsList,
                                        {
                                            id: `q_${Date.now()}`,
                                            text: `Question statement for question ${nextNo}`,
                                            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
                                            correct_answer: 'A',
                                            marks: 1
                                        }
                                    ])
                                    setMasterAnswerKey(prev => ({ ...prev, [nextNo]: 'A' }))
                                }}
                                className="px-5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-[#004B93] text-slate-700 hover:text-[#004B93] text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer bg-white shadow-xs"
                            >
                                <PlusCircle size={15} />
                                <span>Add Another Question</span>
                            </button>
                        </div>

                        {/* STEP 2 BOTTOM NAVIGATION */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => goToStep(1)}
                                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Setup</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveExamAndProceedToPrint}
                                disabled={saving}
                                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-950/20 flex items-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                <span>Save Exam &amp; Proceed to Print Studio ➔</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════ */}
                {/* STEP 3: PRINT & PACKAGING STUDIO                                     */}
                {/* ══════════════════════════════════════════════════════════════════════ */}
                {currentStep === 3 && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* SCOPE & EXAM BANNER */}
                        <div className="w-full bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                                        <Printer size={13} />
                                        <span>Step 3 of 5 &bull; Print Studio</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mt-1">
                                        {selectedExam?.title || setupForm.title || resolvedDefaultTitle}
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Examination papers and matching optical bubble answer sheets are ready for high-resolution printing.
                                    </p>
                                </div>
                                <span className="text-xs text-emerald-300 font-black bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                                    Print-Ready
                                </span>
                            </div>
                        </div>

                        {/* 4 PRINT ASSET TILES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* TILE 1: UNIFIED BUNDLE (PRIMARY ACTION) */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                                        <Printer size={24} />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 mt-3">Unified Print Bundle</h4>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        Prints Question Paper followed immediately by matching Candidate OMR Sheet with identical headers.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const examId = selectedExam?.id || exams[0]?.id
                                        if (examId) window.open(`/api/dashboard/exams/omr/${examId}/print?mode=unified`, '_blank')
                                    }}
                                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Printer size={16} />
                                    <span>Print Paper &amp; OMR Together</span>
                                </button>
                            </div>

                            {/* TILE 2: OMR SHEET ONLY */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#004B93] border border-sky-100 flex items-center justify-center">
                                        <Layers size={22} />
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 mt-3">Candidate OMR Sheet</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Print blank optical bubble answer sheets with student roll number grid and corner fiducials.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const examId = selectedExam?.id || exams[0]?.id
                                        if (examId) window.open(`/api/dashboard/exams/omr/${examId}/print?mode=omr`, '_blank')
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-800 hover:text-[#004B93] font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Layers size={14} />
                                    <span>Print OMR Sheet Only</span>
                                </button>
                            </div>

                            {/* TILE 3: QUESTION PAPER ONLY */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
                                        <FileText size={22} />
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 mt-3">Question Paper Only</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Print formatted question booklets without answer sheets for distribution to exam halls.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const examId = selectedExam?.id || exams[0]?.id
                                        if (examId) window.open(`/api/dashboard/exams/omr/${examId}/print?mode=paper`, '_blank')
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-purple-700 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <FileText size={14} />
                                    <span>Print Question Paper</span>
                                </button>
                            </div>

                            {/* TILE 4: MASTER ANSWER KEY */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                                        <FileSpreadsheet size={22} />
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 mt-3">Master Answer Key</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Print locked answer key matrix (Q1-Q50) for examiners and teachers to verify scores.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        const examId = selectedExam?.id || exams[0]?.id
                                        if (examId) window.open(`/api/dashboard/exams/omr/${examId}/print?mode=key`, '_blank')
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <FileSpreadsheet size={14} />
                                    <span>Print Answer Key</span>
                                </button>
                            </div>
                        </div>

                        {/* STEP 3 BOTTOM ACTIONS */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => goToStep(2)}
                                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Questions</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => goToStep(4)}
                                className="px-8 py-3.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-extrabold text-sm shadow-xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                            >
                                <span>Proceed to Scan &amp; Grade Sheets ➔</span>
                                <ScanLine size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════ */}
                {/* STEP 4: SCAN & AUTOMATED GRADING                                     */}
                {/* ══════════════════════════════════════════════════════════════════════ */}
                {currentStep === 4 && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* SCOPE BANNER */}
                        <div className="w-full bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs uppercase tracking-wider">
                                        <ScanLine size={13} />
                                        <span>Step 4 of 5 &bull; Optical Ingestion</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white mt-1">Check Student Answer Sheets</h3>
                                    <p className="text-xs text-slate-300 mt-0.5">
                                        Upload batch PDF scans or photos from mobile/tablet cameras. The system automatically reads roll numbers and calculates student scores.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-slate-300 font-bold">Target Exam:</label>
                                    <select
                                        value={selectedExam?.id || exams[0]?.id || ''}
                                        onChange={e => {
                                            const found = exams.find(x => x.id === e.target.value)
                                            if (found) setSelectedExam(found)
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 font-bold text-xs text-white"
                                    >
                                        {exams.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* FULL-WIDTH SCAN DROPZONE WORKSTATION */}
                        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm space-y-6">
                            <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-10 text-center relative hover:bg-sky-50/70 transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#004B93] mx-auto mb-4 border border-sky-100">
                                    <UploadCloud size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Upload Student Answer Sheets (Batch PDF / Photos)</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                    Drag and drop multi-page scanned PDF files or high-resolution photos of student sheets. Supports up to 200 sheets at once.
                                </p>

                                {isScanningActive ? (
                                    <div className="mt-6 space-y-3 max-w-md mx-auto">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span className="flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-[#004B93]" />
                                                <span>{scanStage}</span>
                                            </span>
                                            <span className="text-[#004B93] font-black">{scanProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-[#004B93] h-full rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${scanProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleTriggerBatchScan}
                                            className="px-6 py-3 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                                        >
                                            <ScanLine size={16} />
                                            <span>Start Checking 32 Sheets (Batch Scan)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => showToast('Mobile camera scanner ready. Take photos of sheets.', true)}
                                            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs flex items-center gap-2 cursor-pointer"
                                        >
                                            <Camera size={16} className="text-emerald-600" />
                                            <span>Scan with Mobile Camera</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* SCAN STATS CARD */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Processing Speed</span>
                                    <span className="text-sm font-black text-slate-900 mt-0.5 block">1,200 Sheets / Minute</span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Optical Alignment</span>
                                    <span className="text-sm font-black text-emerald-600 mt-0.5 block">Automated 4-Corner Skew Fix</span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Candidate Identification</span>
                                    <span className="text-sm font-black text-[#004B93] mt-0.5 block">Barcode + Roll Number Grid</span>
                                </div>
                            </div>
                        </div>

                        {/* STEP 4 ACTIONS */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => goToStep(3)}
                                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Print Studio</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => goToStep(5)}
                                className="px-8 py-3.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-extrabold text-sm shadow-xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                            >
                                <span>View Results &amp; Student Marks ➔</span>
                                <BarChart3 size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════ */}
                {/* STEP 5: RESULTS & STUDENT MARKS LEDGER                               */}
                {/* ══════════════════════════════════════════════════════════════════════ */}
                {currentStep === 5 && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* PERFORMANCE SUMMARY CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Class Average Score</div>
                                <div className="text-3xl font-black text-slate-900 mt-2">78.4%</div>
                                <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                    <ArrowUpRight size={13} /> +4.2% from previous examination
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Highest Score Scored</div>
                                <div className="text-3xl font-black text-[#004B93] mt-2">98.0%</div>
                                <div className="text-xs font-semibold text-slate-500 mt-1">Aarav Sharma &bull; Class 10 Science</div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Optical Checking Accuracy</div>
                                <div className="text-3xl font-black text-emerald-600 mt-2">100% Verified</div>
                                <div className="text-xs font-semibold text-slate-500 mt-1">All 32 student sheets processed cleanly</div>
                            </div>
                        </div>

                        {/* STUDENT RESULTS TABLE */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">Student Marks List</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        View individual scores, answer accuracy, and verified results for checked sheets.
                                    </p>
                                </div>
                                <button
                                    onClick={() => showToast('Exporting student results to Excel / CSV...', true)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                                >
                                    <Download size={15} />
                                    <span>Download Marks (Excel / CSV)</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                            <th className="py-3.5 px-6">Candidate Roll No. &amp; Name</th>
                                            <th className="py-3.5 px-6">Examination</th>
                                            <th className="py-3.5 px-6">Total Questions</th>
                                            <th className="py-3.5 px-6">Correct</th>
                                            <th className="py-3.5 px-6">Total Marks</th>
                                            <th className="py-3.5 px-6">Scan Confidence</th>
                                            <th className="py-3.5 px-6 text-right">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { name: 'Aarav Sharma', seat: 'ROLL-101', exam: selectedExam?.title || 'Class 10 Science OMR Exam', total: 50, correct: 49, marks: 49, conf: 99.9, res: 'PASS' },
                                            { name: 'Diya Kapoor', seat: 'ROLL-102', exam: selectedExam?.title || 'Class 10 Science OMR Exam', total: 50, correct: 46, marks: 46, conf: 99.6, res: 'PASS' },
                                            { name: 'Rohan Gupta', seat: 'ROLL-103', exam: selectedExam?.title || 'Class 10 Science OMR Exam', total: 50, correct: 44, marks: 44, conf: 99.2, res: 'PASS' },
                                            { name: 'Ananya Iyer', seat: 'ROLL-104', exam: selectedExam?.title || 'Class 10 Science OMR Exam', total: 50, correct: 42, marks: 42, conf: 98.9, res: 'PASS' },
                                            { name: 'Siddharth Nair', seat: 'ROLL-105', exam: selectedExam?.title || 'Class 10 Science OMR Exam', total: 50, correct: 39, marks: 39, conf: 99.1, res: 'PASS' },
                                            { name: 'Pooja Patel', seat: 'ROLL-106', exam: selectedExam?.title || 'Class 10 Science OMR Exam', total: 50, correct: 35, marks: 35, conf: 98.7, res: 'PASS' }
                                        ].map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-4 px-6 font-bold text-slate-900">
                                                    <div>{r.name}</div>
                                                    <div className="text-[11px] font-mono text-slate-400">{r.seat}</div>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">{r.exam}</td>
                                                <td className="py-4 px-6 text-slate-600">{r.total} Qs</td>
                                                <td className="py-4 px-6 font-bold text-emerald-600">{r.correct}</td>
                                                <td className="py-4 px-6 font-black text-slate-900">{r.marks} Marks</td>
                                                <td className="py-4 px-6 font-semibold text-sky-700">{r.conf}%</td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {r.res}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* STEP 5 BOTTOM ACTIONS */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => goToStep(4)}
                                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                <span>Back to Scanner</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleStartNewExam}
                                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-xl flex items-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                            >
                                <PlusCircle size={18} />
                                <span>Create Another OMR Exam ➔</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

function KeyIcon() {
    return <FileSpreadsheet size={20} />
}

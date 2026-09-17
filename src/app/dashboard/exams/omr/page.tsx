'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import ExamSyllabusPatternPicker, { BlueprintContextData } from '@/components/shared/ExamSyllabusPatternPicker'
import {
    ScanLine, UploadCloud, Download, CheckCircle, XCircle,
    Search, Loader2, Sparkles, Printer, Trash2,
    Database, Target, Shield,
    Sliders, RefreshCw, BarChart3, Users, PlusCircle, Check, HelpCircle,
    FileSpreadsheet, ArrowUpRight, Camera, Layers, Award, Clock,
    BookOpen, GraduationCap, Globe, Filter, CheckSquare, Square, BookMarked, Tag
} from 'lucide-react'

export default function OMRExamManager() {
    // Tab Navigation
    const [activeTab, setActiveTab] = useState<'roster' | 'designer' | 'scanner' | 'templates' | 'analytics'>('roster')
    
    // Core Data States
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
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

    // Dynamic Blueprint Context (Syllabus & Patterns)
    const [blueprintContext, setBlueprintContext] = useState<BlueprintContextData | null>(null)
    const [contextLoading, setContextLoading] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState('')
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedSubjectId, setSelectedSubjectId] = useState('')
    const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
    const [selectedPatternId, setSelectedPatternId] = useState('')
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL')
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [selectedExam, setSelectedExam] = useState<any>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Tenant Branding Data
    const [tenantData, setTenantData] = useState<any>(null)

    // Scanner Progress Simulator State
    const [isScanningActive, setIsScanningActive] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)
    const [scanStage, setScanStage] = useState('')

    // New Exam Form State (Blank Exam)
    const [newExamForm, setNewExamForm] = useState({
        title: '',
        class_id: '',
        subject_id: '',
        total_questions: 50,
        omr_template_id: '',
        template_id: '',
        chapter_ids: [] as string[],
        duration: 60
    })

    // AI Exam Creator Wizard State
    const [isAiExamModalOpen, setIsAiExamModalOpen] = useState(false)
    const [aiStep, setAiStep] = useState<'config' | 'review' | 'success'>('config')
    const [aiLoading, setAiLoading] = useState(false)
    const [aiExamForm, setAiExamForm] = useState({
        title: '',
        class_id: '',
        subject_id: '',
        topic: '',
        count: 20,
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        duration: 45,
        omr_template_id: ''
    })

    // Dedicated AI Modal Syllabus Cascading State (Saved in Tenant Portal)
    const [aiBoardId, setAiBoardId] = useState<string>('')
    const [aiClassNodeId, setAiClassNodeId] = useState<string>('')
    const [aiSubjectNodeId, setAiSubjectNodeId] = useState<string>('')
    const [aiSelectedChapterIds, setAiSelectedChapterIds] = useState<string[]>([])
    const [aiSelectedTopicIds, setAiSelectedTopicIds] = useState<string[]>([])
    const [aiChapterSearch, setAiChapterSearch] = useState<string>('')
    const [aiTopicSearch, setAiTopicSearch] = useState<string>('')
    const [aiCustomDirectives, setAiCustomDirectives] = useState<string>('')
    const [aiQuestions, setAiQuestions] = useState<Array<{
        id: string
        text: string
        options: { A: string; B: string; C: string; D: string }
        correct_answer: string
        explanation?: string
        marks?: number
    }>>([])
    const [createdAiExam, setCreatedAiExam] = useState<any>(null)

    // Designer Form State
    const [designerForm, setDesignerForm] = useState({
        name: 'Standard 50-Question Layout',
        total_questions: 50,
        options_per_question: 4,
        columns: 2,
        roll_digits: 8,
        has_barcode: true,
        has_subject_code: true,
        negative_marking: false,
        negative_value: 0.25
    })

    // Answer Key State
    const [answerKeys, setAnswerKeys] = useState<{ [key: number]: string }>({})
    const [isSavingAnswerKey, setIsSavingAnswerKey] = useState(false)

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    // Fetch Blueprint Context (Syllabus & Exam Patterns)
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
            console.error('Failed to load blueprint context in OMR:', err)
        } finally {
            setContextLoading(false)
        }
    }, [selectedBoardId])

    // ── AI MODAL CASCADING SYLLABUS RESOLUTION ──────────────────────────
    const availableAiBoards = useMemo(() => {
        return blueprintContext?.activeBoards || []
    }, [blueprintContext?.activeBoards])

    const currentAiBoard = useMemo(() => {
        if (!availableAiBoards.length) return null
        if (aiBoardId) {
            return availableAiBoards.find(b => b.id === aiBoardId) || availableAiBoards[0]
        }
        return availableAiBoards[0]
    }, [availableAiBoards, aiBoardId])

    const availableAiClasses = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.classes || !currentAiBoard) return []
        return blueprintContext.syllabusTree.classes.filter(c => c.board_id === currentAiBoard.id)
    }, [blueprintContext?.syllabusTree?.classes, currentAiBoard])

    const currentAiClassNode = useMemo(() => {
        if (!availableAiClasses.length) return null
        if (aiClassNodeId) {
            return availableAiClasses.find(c => c.id === aiClassNodeId) || availableAiClasses[0]
        }
        return availableAiClasses[0]
    }, [availableAiClasses, aiClassNodeId])

    const availableAiSubjects = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.subjects || !currentAiClassNode) return []
        return blueprintContext.syllabusTree.subjects.filter(s => s.class_node_id === currentAiClassNode.id)
    }, [blueprintContext?.syllabusTree?.subjects, currentAiClassNode])

    const currentAiSubjectNode = useMemo(() => {
        if (!availableAiSubjects.length) return null
        if (aiSubjectNodeId) {
            return availableAiSubjects.find(s => s.id === aiSubjectNodeId) || availableAiSubjects[0]
        }
        return availableAiSubjects[0]
    }, [availableAiSubjects, aiSubjectNodeId])

    const availableAiChapters = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.chapters || !currentAiSubjectNode) return []
        return blueprintContext.syllabusTree.chapters.filter(ch => ch.subject_node_id === currentAiSubjectNode.id)
    }, [blueprintContext?.syllabusTree?.chapters, currentAiSubjectNode])

    const filteredAiChapters = useMemo(() => {
        if (!aiChapterSearch.trim()) return availableAiChapters
        return availableAiChapters.filter(ch => ch.name.toLowerCase().includes(aiChapterSearch.toLowerCase()))
    }, [availableAiChapters, aiChapterSearch])

    const availableAiTopics = useMemo(() => {
        if (!blueprintContext?.syllabusTree?.topics || aiSelectedChapterIds.length === 0) return []
        return blueprintContext.syllabusTree.topics.filter(tp => aiSelectedChapterIds.includes(tp.chapter_node_id))
    }, [blueprintContext?.syllabusTree?.topics, aiSelectedChapterIds])

    const filteredAiTopics = useMemo(() => {
        if (!aiTopicSearch.trim()) return availableAiTopics
        return availableAiTopics.filter(tp => tp.name.toLowerCase().includes(aiTopicSearch.toLowerCase()))
    }, [availableAiTopics, aiTopicSearch])

    const handleOpenCreateModal = useCallback(async () => {
        setIsCreateModalOpen(true)
        await fetchBlueprintContext()
    }, [fetchBlueprintContext])

    // Fetch Hub Data
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
            setExams(data.exams || [])
            setTemplates(data.templates || [])
            setRecentUploads(data.recentUploads || [])
            setClasses(data.classes || [])
            setSubjects(data.subjects || [])
            if (data.tenant) setTenantData(data.tenant)

            if (data.classes?.length > 0 && !newExamForm.class_id) {
                setNewExamForm(prev => ({
                    ...prev,
                    class_id: data.classes[0].id,
                    subject_id: data.subjects?.[0]?.id || '',
                    omr_template_id: data.templates?.[0]?.id || ''
                }))
                setAiExamForm(prev => ({
                    ...prev,
                    class_id: data.classes[0].id,
                    subject_id: data.subjects?.[0]?.id || '',
                    omr_template_id: data.templates?.[0]?.id || ''
                }))
            }
        } catch (e: any) {
            console.error('Fetch error:', e)
            showToast(e.message || 'Error fetching data', false)
        } finally {
            setLoading(false)
        }
    }, [fetchBlueprintContext, newExamForm.class_id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Filtered Exams
    const filteredExams = useMemo(() => {
        return exams.filter(ex => {
            const matchesSearch = ex.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.classes?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesClass = selectedClassFilter === 'ALL' || ex.class_id === selectedClassFilter
            const matchesStatus = selectedStatusFilter === 'ALL' || ex.status === selectedStatusFilter
            return matchesSearch && matchesClass && matchesStatus
        })
    }, [exams, searchQuery, selectedClassFilter, selectedStatusFilter])

    // Create New Exam Handler
    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newExamForm.title) {
            showToast('Please enter an exam title', false)
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_EXAM',
                    payload: newExamForm
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create exam')

            showToast('Physical OMR Exam created successfully!', true)
            setIsCreateModalOpen(false)
            setNewExamForm(prev => ({ ...prev, title: '' }))
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error creating exam', false)
        } finally {
            setSaving(false)
        }
    }

    // Save Blueprint Handler
    const handleSaveBlueprint = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_TEMPLATE',
                    payload: {
                        name: designerForm.name,
                        total_questions: designerForm.total_questions,
                        options_per_question: designerForm.options_per_question,
                        layout_config: {
                            columns: designerForm.columns,
                            roll_digits: designerForm.roll_digits,
                            barcode_enabled: designerForm.has_barcode,
                            has_subject_code: designerForm.has_subject_code,
                            has_negative_marking: designerForm.negative_marking,
                            negative_value: designerForm.negative_value
                        }
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save blueprint')

            showToast('Blueprint saved to standard templates catalog!', true)
            fetchData()
            setActiveTab('templates')
        } catch (err: any) {
            showToast(err.message || 'Failed to save blueprint', false)
        } finally {
            setSaving(false)
        }
    }

    // Simulate AI Scanner Batch Ingestion
    const handleTriggerBatchScan = async () => {
        if (!selectedExam) {
            showToast('Select a target examination first', false)
            return
        }
        setIsScanningActive(true)
        setScanProgress(10)
        setScanStage('Connecting high-speed optical feeder...')

        setTimeout(() => {
            setScanProgress(35)
            setScanStage('Corner fiducial alignment & deskewing...')
        }, 800)

        setTimeout(() => {
            setScanProgress(65)
            setScanStage('Barcoding decode & student seat mapping...')
        }, 1600)

        setTimeout(() => {
            setScanProgress(90)
            setScanStage('Optical density bubble grading (99.8% precision)...')
        }, 2400)

        setTimeout(async () => {
            setScanProgress(100)
            setScanStage('Batch evaluation completed!')

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
                showToast(`32 OMR Sheets evaluated for ${selectedExam.title}!`, true)
                setIsScanningActive(false)
                setIsUploadModalOpen(false)
                fetchData()
            } catch (e: any) {
                showToast(e.message || 'Error processing batch', false)
                setIsScanningActive(false)
            }
        }, 3200)
    }

    // Delete Exam Handler
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
            fetchData()
        } catch (e: any) {
            showToast(e.message || 'Error deleting exam', false)
        }
    }

    // Open Answer Key Modal - loads real answer key from database if present
    const handleOpenAnswerKey = (exam: any) => {
        setSelectedExam(exam)
        const initial: { [key: number]: string } = {}
        const total = exam.total_questions || 50
        const options = ['A', 'B', 'C', 'D']

        // If exam already has answer_key in DB
        let existingKey: any = exam.answer_key
        if (typeof existingKey === 'string') {
            try { existingKey = JSON.parse(existingKey) } catch (e) { existingKey = null }
        }

        for (let i = 1; i <= total; i++) {
            if (existingKey && existingKey[i]) {
                initial[i] = String(existingKey[i]).trim().toUpperCase()
            } else if (existingKey && existingKey[String(i)]) {
                initial[i] = String(existingKey[String(i)]).trim().toUpperCase()
            } else {
                initial[i] = options[(i - 1) % 4]
            }
        }
        setAnswerKeys(initial)
        setIsAnswerKeyModalOpen(true)
    }

    // Save Answer Key to database
    const handleSaveAnswerKey = async () => {
        if (!selectedExam) return
        setIsSavingAnswerKey(true)
        try {
            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_ANSWER_KEY',
                    payload: {
                        exam_id: selectedExam.id,
                        answer_key: answerKeys
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save answer key')

            showToast('Answer Key saved and synced for automated grading!', true)
            setIsAnswerKeyModalOpen(false)
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error saving answer key', false)
        } finally {
            setIsSavingAnswerKey(false)
        }
    }

    // AI Exam Creator Handlers & Cascading Sync
    const updateAiTopicString = useCallback((nextChapterIds: string[], nextTopicIds: string[], customNotes: string = aiCustomDirectives) => {
        const selectedChaps = availableAiChapters.filter(ch => nextChapterIds.includes(ch.id)).map(ch => ch.name)
        const selectedTps = availableAiTopics.filter(tp => nextTopicIds.includes(tp.id)).map(tp => tp.name)

        let compiled = ''
        if (selectedChaps.length > 0) {
            compiled = `Chapters: ${selectedChaps.join(', ')}`
            if (selectedTps.length > 0) {
                compiled += ` (Key Topics: ${selectedTps.join(', ')})`
            }
        }
        if (customNotes.trim()) {
            compiled = compiled ? `${compiled} | Directives: ${customNotes.trim()}` : customNotes.trim()
        }

        setAiExamForm(prev => {
            let newTitle = prev.title
            if (currentAiClassNode && currentAiSubjectNode) {
                if (selectedChaps.length === 1) {
                    newTitle = `${currentAiClassNode.name} ${currentAiSubjectNode.name} - ${selectedChaps[0]} OMR Exam`
                } else if (selectedChaps.length > 1) {
                    newTitle = `${currentAiClassNode.name} ${currentAiSubjectNode.name} (${selectedChaps.length} Chapters) OMR Exam`
                } else {
                    newTitle = `${currentAiClassNode.name} ${currentAiSubjectNode.name} OMR Exam`
                }
            }
            return {
                ...prev,
                title: newTitle,
                topic: compiled
            }
        })
    }, [availableAiChapters, availableAiTopics, aiCustomDirectives, currentAiClassNode, currentAiSubjectNode])

    const handleOpenAiModal = useCallback(async () => {
        setAiStep('config')
        setAiQuestions([])
        setCreatedAiExam(null)

        let ctx = blueprintContext
        if (!ctx) {
            setContextLoading(true)
            try {
                const res = await fetch('/api/dashboard/exams/blueprint-context')
                if (res.ok) {
                    ctx = await res.json()
                    setBlueprintContext(ctx)
                }
            } catch (err) {
                console.error('Failed to load blueprint context:', err)
            } finally {
                setContextLoading(false)
            }
        }

        const bId = ctx?.activeBoards?.[0]?.id || selectedBoardId || ''
        setAiBoardId(bId)

        const bClasses = ctx?.syllabusTree?.classes?.filter((c: any) => c.board_id === bId) || []
        const cNode = bClasses[0] || null
        const cNodeId = cNode?.id || ''
        setAiClassNodeId(cNodeId)

        const bSubjects = cNode ? (ctx?.syllabusTree?.subjects?.filter((s: any) => s.class_node_id === cNode.id) || []) : []
        const sNode = bSubjects[0] || null
        const sNodeId = sNode?.id || ''
        setAiSubjectNodeId(sNodeId)

        setAiSelectedChapterIds([])
        setAiSelectedTopicIds([])
        setAiChapterSearch('')
        setAiTopicSearch('')
        setAiCustomDirectives('')

        const matchedClass = classes.find(c => c.name.toLowerCase() === cNode?.name?.toLowerCase()) || classes[0]
        const matchedSubject = subjects.find(s => s.name.toLowerCase() === sNode?.name?.toLowerCase()) || subjects[0]

        setAiExamForm({
            title: cNode && sNode ? `${cNode.name} ${sNode.name} OMR Exam` : (classes[0] ? `${classes[0].name} Science OMR Exam` : 'New OMR Exam'),
            class_id: matchedClass?.id || '',
            subject_id: matchedSubject?.id || '',
            topic: '',
            count: 20,
            difficulty: 'medium',
            duration: 45,
            omr_template_id: templates[0]?.id || ''
        })
        setIsAiExamModalOpen(true)
    }, [blueprintContext, selectedBoardId, classes, subjects, templates])

    const handleAiSelectBoard = (newBoardId: string) => {
        setAiBoardId(newBoardId)
        const nextClasses = blueprintContext?.syllabusTree?.classes?.filter(c => c.board_id === newBoardId) || []
        const nextClass = nextClasses[0] || null
        setAiClassNodeId(nextClass?.id || '')

        const nextSubjects = nextClass ? (blueprintContext?.syllabusTree?.subjects?.filter(s => s.class_node_id === nextClass.id) || []) : []
        const nextSubject = nextSubjects[0] || null
        setAiSubjectNodeId(nextSubject?.id || '')

        setAiSelectedChapterIds([])
        setAiSelectedTopicIds([])
        setAiCustomDirectives('')

        const matchedClass = classes.find(c => c.name.toLowerCase() === nextClass?.name.toLowerCase()) || classes[0]
        const matchedSubject = subjects.find(s => s.name.toLowerCase() === nextSubject?.name.toLowerCase()) || subjects[0]

        setAiExamForm(prev => ({
            ...prev,
            title: nextClass && nextSubject ? `${nextClass.name} ${nextSubject.name} OMR Exam` : prev.title,
            class_id: matchedClass?.id || '',
            subject_id: matchedSubject?.id || '',
            topic: ''
        }))
    }

    const handleAiSelectClass = (newClassNodeId: string) => {
        setAiClassNodeId(newClassNodeId)
        const classNode = availableAiClasses.find(c => c.id === newClassNodeId)
        const nextSubjects = blueprintContext?.syllabusTree?.subjects?.filter(s => s.class_node_id === newClassNodeId) || []
        const nextSubject = nextSubjects[0] || null
        setAiSubjectNodeId(nextSubject?.id || '')

        setAiSelectedChapterIds([])
        setAiSelectedTopicIds([])
        setAiCustomDirectives('')

        const matchedClass = classes.find(c => c.name.toLowerCase() === classNode?.name.toLowerCase()) || classes[0]
        const matchedSubject = subjects.find(s => s.name.toLowerCase() === nextSubject?.name.toLowerCase()) || subjects[0]

        setAiExamForm(prev => ({
            ...prev,
            title: classNode && nextSubject ? `${classNode.name} ${nextSubject.name} OMR Exam` : prev.title,
            class_id: matchedClass?.id || '',
            subject_id: matchedSubject?.id || '',
            topic: ''
        }))
    }

    const handleAiSelectSubject = (newSubjectNodeId: string) => {
        setAiSubjectNodeId(newSubjectNodeId)
        const subjectNode = availableAiSubjects.find(s => s.id === newSubjectNodeId)
        const classNode = availableAiClasses.find(c => c.id === aiClassNodeId)

        setAiSelectedChapterIds([])
        setAiSelectedTopicIds([])
        setAiCustomDirectives('')

        const matchedSubject = subjects.find(s => s.name.toLowerCase() === subjectNode?.name.toLowerCase()) || subjects[0]

        setAiExamForm(prev => ({
            ...prev,
            title: classNode && subjectNode ? `${classNode.name} ${subjectNode.name} OMR Exam` : prev.title,
            subject_id: matchedSubject?.id || '',
            topic: ''
        }))
    }

    const handleAiToggleChapter = (chapterId: string) => {
        const isSelected = aiSelectedChapterIds.includes(chapterId)
        const nextChapters = isSelected
            ? aiSelectedChapterIds.filter(id => id !== chapterId)
            : [...aiSelectedChapterIds, chapterId]
        
        setAiSelectedChapterIds(nextChapters)

        let nextTopics = aiSelectedTopicIds
        if (isSelected && blueprintContext?.syllabusTree?.topics) {
            const removedChapterTopicIds = blueprintContext.syllabusTree.topics
                .filter(tp => tp.chapter_node_id === chapterId)
                .map(tp => tp.id)
            nextTopics = nextTopics.filter(id => !removedChapterTopicIds.includes(id))
            setAiSelectedTopicIds(nextTopics)
        }

        updateAiTopicString(nextChapters, nextTopics)
    }

    const handleAiSelectAllChapters = () => {
        const allIds = availableAiChapters.map(ch => ch.id)
        setAiSelectedChapterIds(allIds)
        updateAiTopicString(allIds, aiSelectedTopicIds)
    }

    const handleAiClearChapters = () => {
        setAiSelectedChapterIds([])
        setAiSelectedTopicIds([])
        updateAiTopicString([], [])
    }

    const handleAiToggleTopic = (topicId: string) => {
        const isSelected = aiSelectedTopicIds.includes(topicId)
        const nextTopics = isSelected
            ? aiSelectedTopicIds.filter(id => id !== topicId)
            : [...aiSelectedTopicIds, topicId]
        
        setAiSelectedTopicIds(nextTopics)
        updateAiTopicString(aiSelectedChapterIds, nextTopics)
    }

    const handleAiSelectAllTopics = () => {
        const allTopicIds = availableAiTopics.map(tp => tp.id)
        setAiSelectedTopicIds(allTopicIds)
        updateAiTopicString(aiSelectedChapterIds, allTopicIds)
    }

    const handleAiClearTopics = () => {
        setAiSelectedTopicIds([])
        updateAiTopicString(aiSelectedChapterIds, [])
    }

    const handleGenerateAiQuestions = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!aiExamForm.title.trim()) {
            showToast('Please enter an exam title', false)
            return
        }
        setAiLoading(true)
        try {
            const currentClass = currentAiClassNode?.name || classes.find(c => c.id === aiExamForm.class_id)?.name || 'Class 7'
            const currentSubject = currentAiSubjectNode?.name || subjects.find(s => s.id === aiExamForm.subject_id)?.name || 'Science'

            const selectedChaps = availableAiChapters.filter(ch => aiSelectedChapterIds.includes(ch.id)).map(ch => ch.name)
            const effectiveTopic = aiExamForm.topic.trim() || (selectedChaps.length > 0 ? `Chapters: ${selectedChaps.join(', ')}` : `${currentSubject} Core Curriculum`)

            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'GENERATE_AI_QUESTIONS',
                    payload: {
                        class_name: currentClass,
                        subject_name: currentSubject,
                        topic: effectiveTopic,
                        count: aiExamForm.count,
                        difficulty: aiExamForm.difficulty
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate questions')

            if (data.questions && data.questions.length > 0) {
                setAiQuestions(data.questions)
                setAiStep('review')
                showToast(`Generated ${data.questions.length} questions! Review and edit before approving.`, true)
            } else {
                throw new Error('No questions returned from generator')
            }
        } catch (err: any) {
            showToast(err.message || 'Error generating questions', false)
        } finally {
            setAiLoading(false)
        }
    }

    const handleApproveAndCreateAiExam = async () => {
        if (aiQuestions.length === 0) {
            showToast('No questions to create exam with', false)
            return
        }
        setSaving(true)
        try {
            const keyMap: Record<number, string> = {}
            aiQuestions.forEach((q, idx) => {
                keyMap[idx + 1] = (q.correct_answer || 'A').toUpperCase()
            })

            const matchedClass = classes.find(c => c.name.toLowerCase() === currentAiClassNode?.name?.toLowerCase()) || classes.find(c => c.id === aiExamForm.class_id) || classes[0]
            const matchedSubject = subjects.find(s => s.name.toLowerCase() === currentAiSubjectNode?.name?.toLowerCase()) || subjects.find(s => s.id === aiExamForm.subject_id) || subjects[0]

            const res = await fetch('/api/dashboard/exams/omr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_EXAM_WITH_QUESTIONS',
                    payload: {
                        title: aiExamForm.title,
                        class_id: matchedClass?.id || aiExamForm.class_id,
                        subject_id: matchedSubject?.id || aiExamForm.subject_id,
                        total_questions: aiQuestions.length,
                        duration: aiExamForm.duration,
                        omr_template_id: aiExamForm.omr_template_id || null,
                        instructions: 'Use blue/black ballpoint pen only. Darken the bubbles completely. Each question carries equal marks.',
                        questions: aiQuestions,
                        answer_key: keyMap,
                        chapter_ids: aiSelectedChapterIds
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save exam')

            setCreatedAiExam(data.exam)
            setAiStep('success')
            showToast('Exam, Questions, and Answer Key saved successfully!', true)
            fetchData()
        } catch (err: any) {
            showToast(err.message || 'Error saving exam', false)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-sky-200 border-t-[#004B93] rounded-full animate-spin" />
                    <ScanLine className="absolute inset-0 m-auto text-[#004B93]" size={24} />
                </div>
                <h3 className="mt-4 font-bold text-slate-800 text-lg">Initializing OMR Scanner Laboratory...</h3>
                <p className="text-slate-500 text-sm mt-1">Grounding optical calibration matrices & offline examinations</p>
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
                        className="object-cover object-center opacity-40 mix-blend-luminosity scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
                </div>

                <div className="w-full px-4 sm:px-8 py-10 sm:py-14 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                <span className="text-xs font-black tracking-widest text-sky-400 uppercase">
                                    EXAMINATION & PRINT MANAGEMENT
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                                Exams & OMR Sheets
                            </h1>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                                Create question papers with matching OMR response sheets in 1-click. Generate questions with Gemini AI, review and edit questions and answers, and print combined exam booklets with your school&apos;s logo and branding.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
                                <span className="flex items-center gap-1.5"><Shield size={15} className="text-emerald-400" /> Dynamic School Logo & Branding</span>
                                <span className="flex items-center gap-1.5"><Printer size={15} className="text-sky-400" /> 1-Click Unified Print (Paper + OMR)</span>
                                <span className="flex items-center gap-1.5"><Sparkles size={15} className="text-amber-400" /> Gemini AI Automated Answer Key</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <button
                                onClick={handleOpenAiModal}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-amber-950/40 border border-amber-300/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <Sparkles size={18} />
                                <span>Create Exam with AI</span>
                            </button>
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#004B93] to-sky-600 hover:from-sky-700 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-950/40 border border-sky-300/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <PlusCircle size={18} />
                                <span>Create Blank Exam</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (exams.length > 0) setSelectedExam(exams[0])
                                    setIsUploadModalOpen(true)
                                }}
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-white font-bold text-sm backdrop-blur-md border border-slate-700 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <UploadCloud size={18} className="text-sky-400" />
                                <span>Upload Scans</span>
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                                title="Refresh data"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN FULL-WIDTH WORKSPACE */}
            <div className="w-full px-4 sm:px-8 -mt-6 relative z-20 space-y-6">
                
                {/* 4 EXECUTIVE KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-sky-50 flex items-center justify-center text-[#004B93] border border-sky-100">
                            <Target size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Saved Sheet Formats</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalTemplates} Formats</div>
                            <div className="text-[11px] font-semibold text-sky-700 mt-1 flex items-center gap-1">
                                <CheckCircle size={12} /> Ready for Print
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <UploadCloud size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Sheets Checked</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalScanned} Sheets</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <ArrowUpRight size={12} /> Auto Scanned
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <Shield size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Scanning Accuracy</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.successRate}</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <Check size={12} /> High Reliability
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-13 h-13 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                            <Award size={26} />
                        </div>
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Students Evaluated</div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalEvaluated} Graded</div>
                            <div className="text-[11px] font-semibold text-purple-700 mt-1 flex items-center gap-1">
                                <Users size={12} /> Marks Recorded
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5 OPERATIONAL TABS */}
                <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm flex items-center gap-2 overflow-x-auto">
                    {[
                        { id: 'roster', label: 'All Exams', icon: Database, count: exams.length },
                        { id: 'designer', label: 'Design Sheet Layout', icon: Sliders },
                        { id: 'scanner', label: 'Scan & Check Sheets', icon: ScanLine, badge: 'Auto Checker' },
                        { id: 'templates', label: 'Saved Sheet Formats', icon: Layers, count: templates.length },
                        { id: 'analytics', label: 'Results & Reports', icon: BarChart3 }
                    ].map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
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
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-400 text-slate-950">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* TAB CONTENT AREAS */}

                {/* TAB 1: OMR EXAM ROSTER */}
                {activeTab === 'roster' && (
                    <div className="w-full space-y-4">
                        {/* SEARCH & FILTER BAR */}
                        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by exam title, class, or subject..."
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
                                    value={selectedStatusFilter}
                                    onChange={e => setSelectedStatusFilter(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="published">Ready to Scan (Published)</option>
                                    <option value="completed">Evaluated & Completed</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>

                        {/* EXAMS DATA TABLE */}
                        <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                            <th className="py-4 px-6">Exam Title & Details</th>
                                            <th className="py-4 px-6">Class & Subject</th>
                                            <th className="py-4 px-6">Sheet Format</th>
                                            <th className="py-4 px-6">Status</th>
                                            <th className="py-4 px-6 text-right">Print & Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredExams.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-slate-500">
                                                    <Target className="mx-auto text-slate-300 mb-2" size={40} />
                                                    <p className="font-semibold">No examinations found</p>
                                                    <p className="text-xs text-slate-400 mt-1">Click &quot;Create Exam with AI&quot; or &quot;Create Blank Exam&quot; to start.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredExams.map(ex => {
                                                const isCompleted = ex.status === 'completed'
                                                const hasAnswerKey = ex.answer_key && (typeof ex.answer_key === 'object' ? Object.keys(ex.answer_key).length > 0 : true)
                                                return (
                                                    <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="font-extrabold text-slate-900 text-base">{ex.title}</div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1 font-semibold text-slate-600">
                                                                    <HelpCircle size={13} className="text-sky-600" />
                                                                    {ex.total_questions} Questions
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 text-slate-500">
                                                                    <Clock size={13} /> {ex.duration || 60} Mins
                                                                </span>
                                                                {hasAnswerKey && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                                                            <CheckCircle size={12} /> Answer Key Ready
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="font-bold text-slate-800">{ex.classes?.name || 'All Classes'}</div>
                                                            <div className="text-xs font-semibold text-sky-700 mt-0.5">
                                                                {ex.subjects?.name || 'General'} {ex.subjects?.code ? `(${ex.subjects.code})` : ''}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-50 text-[#004B93] border border-sky-200">
                                                                <Layers size={13} />
                                                                {ex.omr_templates?.name?.slice(0, 32) || 'Standard Layout'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {isCompleted ? (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <CheckCircle size={13} /> Evaluated
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                                                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                                                    Ready to Print & Scan
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {/* 1-Click Unified Print (Question Paper + OMR Sheet) */}
                                                                <button
                                                                    onClick={() => window.open(`/api/dashboard/exams/omr/${ex.id}/print?mode=unified`, '_blank')}
                                                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                                                    title="Print Question Paper and OMR Sheet together in 1-click"
                                                                >
                                                                    <Printer size={14} />
                                                                    <span>Print Booklet</span>
                                                                </button>

                                                                {/* Edit Answer Key */}
                                                                <button
                                                                    onClick={() => handleOpenAnswerKey(ex)}
                                                                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                                    title="View or Edit Answer Key"
                                                                >
                                                                    <FileSpreadsheet size={14} />
                                                                    <span>Answer Key</span>
                                                                </button>

                                                                {/* Scan / Check */}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedExam(ex)
                                                                        setActiveTab('scanner')
                                                                    }}
                                                                    className="p-2 rounded-lg bg-[#004B93] hover:bg-sky-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                                                                    title="Scan Student Sheets"
                                                                >
                                                                    <ScanLine size={15} />
                                                                </button>

                                                                {/* Delete */}
                                                                <button
                                                                    onClick={() => handleDeleteExam(ex.id, ex.title)}
                                                                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer"
                                                                    title="Delete Exam"
                                                                >
                                                                    <Trash2 size={15} />
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
                    </div>
                )}

                {/* TAB 2: BLUEPRINT DESIGNER (FULL-WIDTH 2-COLUMN STUDIO) */}
                {activeTab === 'designer' && (
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT: DESIGN CONTROLS */}
                        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-[#004B93] font-bold text-xs">
                                    <Sliders size={14} />
                                    <span>SHEET SETTINGS</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mt-2">Customize OMR Sheet</h2>
                                <p className="text-slate-500 text-xs mt-1">Set question count, options per question, number of columns, and student roll number boxes.</p>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Layout Name</label>
                                    <input
                                        type="text"
                                        value={designerForm.name}
                                        onChange={e => setDesignerForm({ ...designerForm, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Total Questions</label>
                                        <select
                                            value={designerForm.total_questions}
                                            onChange={e => setDesignerForm({ ...designerForm, total_questions: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            <option value={20}>20 Questions (Quiz)</option>
                                            <option value={40}>40 Questions (Unit Test)</option>
                                            <option value={50}>50 Questions (Standard)</option>
                                            <option value={60}>60 Questions (Mid-Term)</option>
                                            <option value={100}>100 Questions (Final Exam)</option>
                                            <option value={180}>180 Questions (Full Mock)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Columns on Page</label>
                                        <select
                                            value={designerForm.columns}
                                            onChange={e => setDesignerForm({ ...designerForm, columns: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            <option value={1}>1 Column</option>
                                            <option value={2}>2 Columns (Recommended)</option>
                                            <option value={3}>3 Columns</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Options Per Question</label>
                                        <select
                                            value={designerForm.options_per_question}
                                            onChange={e => setDesignerForm({ ...designerForm, options_per_question: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                        >
                                            <option value={4}>4 Options (A, B, C, D)</option>
                                            <option value={5}>5 Options (A, B, C, D, E)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Roll Number Digits</label>
                                        <input
                                            type="number"
                                            value={designerForm.roll_digits}
                                            onChange={e => setDesignerForm({ ...designerForm, roll_digits: parseInt(e.target.value) })}
                                            min={6}
                                            max={12}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={designerForm.has_barcode}
                                            onChange={e => setDesignerForm({ ...designerForm, has_barcode: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 text-xs block">Include Barcode</span>
                                            <span className="text-[11px] text-slate-500">Helps automatically identify student roll number when scanned.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={designerForm.negative_marking}
                                            onChange={e => setDesignerForm({ ...designerForm, negative_marking: e.target.checked })}
                                            className="w-4 h-4 text-[#004B93] rounded"
                                        />
                                        <div>
                                            <span className="font-bold text-slate-800 text-xs block">Negative Marking</span>
                                            <span className="text-[11px] text-slate-500">Deduct marks for wrong answers during automated checking.</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleSaveBlueprint}
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <SaveIcon />}
                                    <span>Save Sheet Layout</span>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: LIVE INTERACTIVE OMR SHEET PREVIEW */}
                        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Printer size={18} className="text-[#004B93]" />
                                    <span className="font-black text-slate-900 text-sm">Live Sheet Preview</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    Ready for Print (A4)
                                </span>
                            </div>

                            {/* SHEET REPLICA CONTAINER */}
                            <div className="w-full bg-white border-2 border-slate-900 rounded-lg p-6 relative font-mono text-xs shadow-inner min-h-[500px]">
                                {/* 4 CORNER FIDUCIAL ALIGNMENT MARKERS */}
                                <div className="absolute top-2 left-2 w-6 h-6 bg-black" />
                                <div className="absolute top-2 right-2 w-6 h-6 bg-black" />
                                <div className="absolute bottom-2 left-2 w-6 h-6 bg-black" />
                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-black" />

                                {/* SHEET HEADER */}
                                <div className="text-center border-b-2 border-black pb-3 mb-4 mx-8">
                                    <div className="font-black text-base uppercase tracking-tight text-slate-950">
                                        {tenantData?.settings?.branding?.name || tenantData?.name || 'School Name'}
                                    </div>
                                    <div className="font-bold text-xs uppercase text-slate-800 mt-0.5">
                                        {designerForm.name}
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-1">
                                        USE BLUE/BLACK BALLPOINT PEN ONLY • DARKEN BUBBLE FULLY
                                    </div>
                                </div>

                                {/* ROLL NUMBER GRID SIMULATION */}
                                <div className="flex items-center justify-between gap-4 border border-black p-3 mb-4 mx-8 bg-slate-50/50">
                                    <div className="font-bold text-[11px]">CANDIDATE ROLL NUMBER:</div>
                                    <div className="flex gap-1.5">
                                        {Array.from({ length: designerForm.roll_digits }).map((_, i) => (
                                            <div key={i} className="flex flex-col items-center gap-1">
                                                <div className="w-5 h-6 border border-black bg-white flex items-center justify-center font-bold text-[10px]">
                                                    {i + 1}
                                                </div>
                                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 text-[8px] flex items-center justify-center text-slate-400">0</div>
                                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 text-[8px] flex items-center justify-center text-slate-400">1</div>
                                            </div>
                                        ))}
                                    </div>
                                    {designerForm.has_barcode && (
                                        <div className="text-right">
                                            <div className="w-20 h-6 bg-slate-900 text-white flex items-center justify-center text-[9px] tracking-widest">
                                                ||| | |||| |
                                            </div>
                                            <div className="text-[8px] text-slate-500 mt-0.5 font-sans">BC-OMR-2026</div>
                                        </div>
                                    )}
                                </div>

                                {/* DYNAMIC BUBBLE COLUMNS */}
                                <div className={`grid grid-cols-${designerForm.columns} gap-6 mx-8 max-h-72 overflow-y-auto pr-2`}>
                                    {Array.from({ length: Math.min(designerForm.total_questions, 40) }).map((_, qIdx) => {
                                        const qNum = qIdx + 1
                                        return (
                                            <div key={qNum} className="flex items-center justify-between gap-2 py-1 border-b border-slate-200">
                                                <span className="font-bold text-slate-800 w-6 text-right text-[11px]">
                                                    {String(qNum).padStart(2, '0')}.
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {['A', 'B', 'C', 'D', 'E'].slice(0, designerForm.options_per_question).map((opt, oIdx) => (
                                                        <div
                                                            key={opt}
                                                            className={`w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold transition-all ${
                                                                qNum === 2 && opt === 'B' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
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

                                {designerForm.total_questions > 40 && (
                                    <div className="text-center text-[10px] text-slate-400 mt-3 font-sans italic">
                                        + {designerForm.total_questions - 40} additional questions configured on second section / reverse side.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: AI OPTICAL SCANNER & EVALUATOR */}
                {activeTab === 'scanner' && (
                    <div className="w-full space-y-6">
                        <div className="w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-xs">
                                        <ScanLine size={14} />
                                        <span>ACTIVE SCANNING ENGINE</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                                        AI Optical Recognition & Evaluation Desk
                                    </h2>
                                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                        Ingest high-speed batch scans or upload photos directly from school administrative tablets.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold uppercase text-slate-500">Target Exam:</label>
                                    <select
                                        value={selectedExam?.id || ''}
                                        onChange={e => {
                                            const found = exams.find(x => x.id === e.target.value)
                                            setSelectedExam(found)
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 bg-white"
                                    >
                                        {exams.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* SCANNER WORKSTATION INTERACTION */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                                {/* UPLOAD / SCAN CONTROLS */}
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-8 text-center relative hover:bg-sky-50/70 transition-all">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#004B93] mx-auto mb-4 border border-sky-100">
                                            <UploadCloud size={32} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">Ingest Scanned Bubble Sheets</h3>
                                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                                            Drop PDF bundles from your feeder scanner or high-res photos (JPG, PNG). The AI engine will align corner fiducials and evaluate student answers.
                                        </p>

                                        {isScanningActive ? (
                                            <div className="mt-6 space-y-3 max-w-md mx-auto">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <span>{scanStage}</span>
                                                    <span>{scanProgress}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#004B93] to-sky-500 transition-all duration-300 rounded-full"
                                                        style={{ width: `${scanProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                                                <button
                                                    onClick={handleTriggerBatchScan}
                                                    className="px-6 py-3 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                                                >
                                                    <ScanLine size={16} />
                                                    <span>Run Automated Ingestion (32 Sheets)</span>
                                                </button>
                                                <button
                                                    onClick={() => showToast('Tablet Camera Scanner Ready', true)}
                                                    className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition-all flex items-center gap-2"
                                                >
                                                    <Camera size={16} />
                                                    <span>Capture via Tablet</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* PRECISION METRICS BANNER */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="text-xs text-slate-500 font-bold">Fiducial Tolerance</div>
                                            <div className="text-lg font-black text-slate-900 mt-0.5">±15° Skew</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="text-xs text-slate-500 font-bold">Bubble Threshold</div>
                                            <div className="text-lg font-black text-slate-900 mt-0.5">55% Shading</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="text-xs text-slate-500 font-bold">Barcode Support</div>
                                            <div className="text-lg font-black text-emerald-600 mt-0.5">Auto-Mapped</div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: RECENT BATCH LOGS */}
                                <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-slate-900 text-sm">Batch Ingestion History</h4>
                                        <span className="text-[11px] font-bold text-slate-500">{recentUploads.length} Batches Logged</span>
                                    </div>

                                    <div className="space-y-3">
                                        {recentUploads.length === 0 ? (
                                            <div className="text-center py-8 text-xs text-slate-400">No scanner uploads logged yet</div>
                                        ) : (
                                            recentUploads.map((u: any) => (
                                                <div key={u.id} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {u.offline_exams?.title || 'Batch Scan'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                                            <span>{u.processed_sheets} Sheets</span>
                                                            <span>•</span>
                                                            <span className="uppercase text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{u.source || 'bulk'}</span>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                        <CheckCircle size={11} /> Completed
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: STANDARDIZED TEMPLATES GALLERY */}
                {activeTab === 'templates' && (
                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Standardized Bubble Sheet Catalog</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                    Pre-engineered, tested optical templates compliant with Indian and International school board mandates.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('designer')}
                                className="px-4 py-2 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs flex items-center gap-2"
                            >
                                <PlusCircle size={15} />
                                <span>Create Custom Blueprint</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {templates.map(tmpl => {
                                const config = tmpl.layout_config || {}
                                return (
                                    <div key={tmpl.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                                        <div className="space-y-4">
                                            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#004B93] group-hover:scale-110 transition-transform">
                                                <Layers size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{tmpl.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                                                    {config.sections ? config.sections.join(', ') : 'Standardized single-page examination matrix.'}
                                                </p>
                                            </div>
                                            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Total Questions:</span>
                                                    <span className="font-bold text-slate-900">{tmpl.total_questions} Qs</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Column Grid:</span>
                                                    <span className="font-bold text-slate-900">{config.columns || 2} Columns</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Roll Digits:</span>
                                                    <span className="font-bold text-slate-900">{config.roll_digits || 8} Digits</span>
                                                </div>
                                                <div className="flex justify-between text-slate-600">
                                                    <span>Options:</span>
                                                    <span className="font-bold text-slate-900">{tmpl.options_per_question || 4} Choices</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                onClick={() => {
                                                    setNewExamForm(prev => ({
                                                        ...prev,
                                                        omr_template_id: tmpl.id,
                                                        total_questions: tmpl.total_questions
                                                    }))
                                                    handleOpenCreateModal()
                                                }}
                                                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-[#004B93] text-slate-700 hover:text-white font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <span>Deploy with Exam</span>
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 5: RESULTS & ANALYTICS */}
                {activeTab === 'analytics' && (
                    <div className="w-full space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cohort Average Score</div>
                                <div className="text-3xl font-black text-slate-900 mt-2">78.4%</div>
                                <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                    <ArrowUpRight size={13} /> +4.2% vs previous term
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Peak Performance</div>
                                <div className="text-3xl font-black text-[#004B93] mt-2">98.0%</div>
                                <div className="text-xs font-semibold text-slate-500 mt-1">Aarav Sharma • Grade 10 Math</div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Scanner Audit Status</div>
                                <div className="text-3xl font-black text-emerald-600 mt-2">100% Verified</div>
                                <div className="text-xs font-semibold text-slate-500 mt-1">0 manual intervention flags</div>
                            </div>
                        </div>

                        {/* STUDENT RESULTS TABLE */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">Candidate Evaluation Ledger</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Direct optical sheet responses mapped to student gradebook.</p>
                                </div>
                                <button
                                    onClick={() => showToast('Exporting OMR Results to CSV...', true)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2"
                                >
                                    <Download size={14} />
                                    <span>Export Gradebook CSV</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                            <th className="py-3.5 px-6">Candidate / Seat</th>
                                            <th className="py-3.5 px-6">Exam Title</th>
                                            <th className="py-3.5 px-6">Total Questions</th>
                                            <th className="py-3.5 px-6">Correct</th>
                                            <th className="py-3.5 px-6">Total Marks</th>
                                            <th className="py-3.5 px-6">Optical Confidence</th>
                                            <th className="py-3.5 px-6 text-right">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { name: 'Aarav Sharma', seat: 'SEAT-101', exam: 'All-India STEM & Cyber Talent', total: 60, correct: 58, marks: 232, conf: 99.8, res: 'PASS' },
                                            { name: 'Diya Kapoor', seat: 'SEAT-102', exam: 'All-India STEM & Cyber Talent', total: 60, correct: 54, marks: 212, conf: 99.4, res: 'PASS' },
                                            { name: 'Rohan Gupta', seat: 'SEAT-103', exam: 'All-India STEM & Cyber Talent', total: 60, correct: 51, marks: 198, conf: 99.1, res: 'PASS' },
                                            { name: 'Ananya Iyer', seat: 'SEAT-104', exam: 'Senior Physics Weekly Drill', total: 25, correct: 24, marks: 96, conf: 99.9, res: 'PASS' },
                                            { name: 'Siddharth Nair', seat: 'SEAT-105', exam: 'Senior Physics Weekly Drill', total: 25, correct: 21, marks: 84, conf: 98.7, res: 'PASS' }
                                        ].map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50/60">
                                                <td className="py-4 px-6 font-bold text-slate-900">
                                                    <div>{r.name}</div>
                                                    <div className="text-[11px] font-mono text-slate-400">{r.seat}</div>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-700">{r.exam}</td>
                                                <td className="py-4 px-6 text-slate-600">{r.total} Qs</td>
                                                <td className="py-4 px-6 font-bold text-emerald-600">{r.correct}</td>
                                                <td className="py-4 px-6 font-black text-slate-900">{r.marks} pts</td>
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
                    </div>
                )}
            </div>

            {/* MODAL 1: CREATE NEW OMR EXAM */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
                        
                        {/* MODAL HEADER (Fixed Top) */}
                        <div className="shrink-0 px-6 sm:px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-[#004B93]/10 border border-[#004B93]/20 flex items-center justify-center text-[#004B93] shadow-sm">
                                    <ScanLine size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Create Blank Exam</h3>
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Custom Sheet Format
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Set up exam details, select class, subject, syllabus, and question count for printing OMR sheets.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fetchBlueprintContext()}
                                    disabled={contextLoading}
                                    title="Refire & reload published board patterns from registry"
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <RefreshCw size={13} className={contextLoading ? 'animate-spin text-[#004B93]' : ''} />
                                    <span className="hidden md:inline">Refire Registry</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <XCircle size={22} />
                                </button>
                            </div>
                        </div>

                        {/* MODAL BODY (Scrollable Workspace) */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/50">
                            <form id="create-omr-form" onSubmit={handleCreateExam} className="space-y-6 text-sm">
                                
                                {/* CARD 1: SYLLABUS & STANDARD PATTERN SELECTOR */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#004B93] flex items-center justify-center font-black text-xs border border-sky-100">
                                                1
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm sm:text-base">Syllabus Scope & Standard Board Pattern</h4>
                                                <p className="text-xs text-slate-500">Pick board, class, subject & live exam patterns (e.g. Gujarat Board, CBSE, ICSE).</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Master Unified Syllabus & Exam Pattern Picker */}
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
                                            const matched = classes.find((c: any) => c.name.toLowerCase() === cNode.name.toLowerCase()) || classes[0]
                                            setNewExamForm(prev => ({ ...prev, class_id: matched?.id || cNode.id }))
                                            setSelectedSubjectId('')
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectSubject={sNode => {
                                            setSelectedSubjectId(sNode.id)
                                            const matched = subjects.find((s: any) => s.name.toLowerCase() === sNode.name.toLowerCase()) || subjects[0]
                                            setNewExamForm(prev => ({ ...prev, subject_id: matched?.id || sNode.id }))
                                            setSelectedChapterIds([])
                                            setSelectedTopicIds([])
                                        }}
                                        onSelectChapters={chIds => {
                                            setSelectedChapterIds(chIds)
                                            setNewExamForm(prev => ({ ...prev, chapter_ids: chIds }))
                                        }}
                                        onSelectTopics={tpIds => {
                                            setSelectedTopicIds(tpIds)
                                            setNewExamForm(prev => ({ ...prev, topic_ids: tpIds }))
                                        }}
                                        onSelectPattern={pattern => {
                                            setSelectedPatternId(pattern.id)
                                            const totalQ = pattern.sections?.reduce(
                                                (acc: number, s: any) => acc + (s.rules?.reduce((ra: number, r: any) => ra + Number(r.num_questions || 0), 0) || 0), 0
                                            ) || 50
                                            const matchingOmr = templates.find((t: any) => t.total_questions === totalQ) || templates[0]
                                            setNewExamForm(prev => ({
                                                ...prev,
                                                template_id: pattern.id,
                                                title: prev.title ? prev.title : `${pattern.name} OMR Assessment`,
                                                total_questions: totalQ,
                                                duration: pattern.duration_minutes || 60,
                                                omr_template_id: matchingOmr?.id || prev.omr_template_id
                                            }))
                                            showToast(`Pattern "${pattern.name}" loaded for physical OMR test!`, true)
                                        }}
                                    />
                                </div>

                                {/* CARD 2: PAPER SPECIFICATIONS & BUBBLE LAYOUT */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#004B93] flex items-center justify-center font-black text-xs border border-sky-100">
                                                2
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm sm:text-base">Examination Details & Bubble Sheet Architecture</h4>
                                                <p className="text-xs text-slate-500">Configure title, duration, question budget and scanner grid template.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exam Title */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                            Exam Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Grade 10 Midterm Mathematics OMR Assessment"
                                            value={newExamForm.title}
                                            onChange={e => setNewExamForm({ ...newExamForm, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#004B93] focus:border-[#004B93] focus:outline-none transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* 3-Column Specifications Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                                Bubble Count (Questions)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={newExamForm.total_questions}
                                                    onChange={e => setNewExamForm({ ...newExamForm, total_questions: parseInt(e.target.value) || 0 })}
                                                    min={10}
                                                    max={200}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-sm"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    Qs
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                                Duration (Minutes)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={newExamForm.duration}
                                                    onChange={e => setNewExamForm({ ...newExamForm, duration: parseInt(e.target.value) || 0 })}
                                                    min={15}
                                                    max={300}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-sm"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    Mins
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                                Optical Bubble Grid Layout
                                            </label>
                                            <select
                                                value={newExamForm.omr_template_id}
                                                onChange={e => setNewExamForm({ ...newExamForm, omr_template_id: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-sm"
                                            >
                                                {templates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.total_questions} Qs)</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* MODAL FOOTER (Fixed Bottom) */}
                        <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-3 py-1 rounded-lg bg-sky-50 text-[#004B93] font-black border border-sky-100">
                                    {newExamForm.total_questions} Questions
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-black border border-amber-200/80">
                                    {newExamForm.duration} Mins
                                </span>
                                {newExamForm.template_id && (
                                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle size={13} /> Pattern Linked
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-omr-form"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md shadow-sky-950/20 flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    <span>Create Exam</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL 2: ANSWER KEY MASTER CONFIGURATION */}
            {isAnswerKeyModalOpen && selectedExam && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Exam Answer Key</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedExam.title} ({selectedExam.total_questions} Questions)</p>
                            </div>
                            <button
                                onClick={() => setIsAnswerKeyModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            <div className="flex items-center justify-between bg-sky-50 p-3 rounded-xl border border-sky-200">
                                <span className="text-xs font-bold text-[#004B93]">Quick Fill Pattern:</span>
                                <div className="flex gap-2">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                const updated: { [key: number]: string } = {}
                                                const total = selectedExam.total_questions || 50
                                                for (let i = 1; i <= total; i++) updated[i] = opt
                                                setAnswerKeys(updated)
                                            }}
                                            className="px-2.5 py-1 rounded-md bg-white border border-sky-300 font-bold text-xs text-[#004B93] hover:bg-sky-100"
                                        >
                                            All {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {Array.from({ length: selectedExam.total_questions || 50 }).map((_, idx) => {
                                    const qNo = idx + 1
                                    const selected = answerKeys[qNo] || 'A'
                                    return (
                                        <div key={qNo} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                                            <span className="font-extrabold text-xs text-slate-700 w-6">Q{qNo}</span>
                                            <div className="flex gap-1">
                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => setAnswerKeys({ ...answerKeys, [qNo]: opt })}
                                                        className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                                                            selected === opt
                                                                ? 'bg-[#004B93] text-white shadow-sm'
                                                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => setIsAnswerKeyModalOpen(false)}
                                disabled={isSavingAnswerKey}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleSaveAnswerKey}
                                disabled={isSavingAnswerKey}
                                className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSavingAnswerKey ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                <span>{isSavingAnswerKey ? 'Saving...' : 'Save Answer Key'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: CREATE EXAM WITH AI (WIZARD WITH INLINE EDITING) */}
            {isAiExamModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
                        
                        {/* WIZARD HEADER */}
                        <div className="shrink-0 px-6 sm:px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Create Exam with Gemini AI</h3>
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                            Auto Answer Key & Matching OMR
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Generates questions, 4 multiple choice options, and answers. Review and edit inline, then print Question Paper and OMR sheet together.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsAiExamModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        {/* STEP 1: CONFIGURE & GENERATE */}
                        {aiStep === 'config' && (
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/50">
                                <form onSubmit={handleGenerateAiQuestions} className="space-y-6 max-w-3xl mx-auto">
                                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                                        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-base">1. Syllabus, Class & Subject</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Curriculum, classes, subjects, and chapters are fetched from your institutional syllabus saved in the tenant portal.
                                                </p>
                                            </div>
                                            {currentAiBoard && (
                                                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#004B93] border border-sky-200">
                                                    <Globe size={13} />
                                                    <span>{currentAiBoard.name}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* CURRICULUM BOARD SELECTION (Saved in Tenant Portal) */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-blue-50/40 border border-sky-100 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                    <Globe size={15} className="text-[#004B93]" />
                                                    <span>Curriculum / Syllabus Board</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-[#004B93] text-white">
                                                        Saved in Tenant Portal
                                                    </span>
                                                </label>
                                                {availableAiBoards.length > 1 && (
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {availableAiBoards.length} Syllabuses Available
                                                    </span>
                                                )}
                                            </div>

                                            <select
                                                value={aiBoardId || currentAiBoard?.id || ''}
                                                onChange={e => handleAiSelectBoard(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-xs text-sm"
                                            >
                                                {availableAiBoards.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name} {b.source_type === 'owner_public' ? '(Master Syllabus)' : b.source_type === 'excel' ? '(Spreadsheet)' : '(Custom)'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* CLASS & SUBJECT SELECTORS (Cascading from Syllabus) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                                                    <GraduationCap size={15} className="text-[#004B93]" />
                                                    <span>Class / Grade</span>
                                                </label>
                                                <select
                                                    value={aiClassNodeId || currentAiClassNode?.id || ''}
                                                    onChange={e => handleAiSelectClass(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-xs text-sm"
                                                >
                                                    {availableAiClasses.length > 0 ? (
                                                        availableAiClasses.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))
                                                    ) : (
                                                        classes.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                                                    <BookOpen size={15} className="text-emerald-600" />
                                                    <span>Subject</span>
                                                </label>
                                                <select
                                                    value={aiSubjectNodeId || currentAiSubjectNode?.id || ''}
                                                    onChange={e => handleAiSelectSubject(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-xs text-sm"
                                                >
                                                    {availableAiSubjects.length > 0 ? (
                                                        availableAiSubjects.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))
                                                    ) : (
                                                        subjects.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* TOPIC / CHAPTERS (MULTIPLE SELECTION) */}
                                        <div className="rounded-2xl border border-slate-200/90 p-5 bg-slate-50/50 space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs">
                                                        <Layers size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                                Topic / Chapters to Cover
                                                            </span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-200">
                                                                Multiple Selection
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            {aiSelectedChapterIds.length} of {availableAiChapters.length} Chapters Selected
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs font-bold">
                                                    {availableAiChapters.length > 4 && (
                                                        <div className="relative">
                                                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search chapters..."
                                                                value={aiChapterSearch}
                                                                onChange={e => setAiChapterSearch(e.target.value)}
                                                                className="pl-7 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#004B93] bg-white w-36 sm:w-44"
                                                            />
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={handleAiSelectAllChapters}
                                                        className="px-2.5 py-1 rounded-lg text-[#004B93] hover:bg-sky-50 font-bold cursor-pointer transition-colors"
                                                    >
                                                        Select All
                                                    </button>
                                                    <span className="text-slate-300">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleAiClearChapters}
                                                        className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>

                                            {/* CHAPTER PILLS GRID */}
                                            {availableAiChapters.length > 0 ? (
                                                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                                                    {filteredAiChapters.map(ch => {
                                                        const isSelected = aiSelectedChapterIds.includes(ch.id)
                                                        return (
                                                            <button
                                                                key={ch.id}
                                                                type="button"
                                                                onClick={() => handleAiToggleChapter(ch.id)}
                                                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 cursor-pointer text-left ${
                                                                    isSelected
                                                                        ? 'bg-blue-50 text-[#004B93] border-[#004B93] font-bold shadow-sm ring-1 ring-[#004B93]/20'
                                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                                                }`}
                                                            >
                                                                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                                                                    isSelected ? 'bg-[#004B93] text-white' : 'border border-slate-300 bg-white'
                                                                }`}>
                                                                    {isSelected && <Check size={11} strokeWidth={3} />}
                                                                </span>
                                                                <span className="leading-snug">{ch.name}</span>
                                                                {ch.exam_weightage && Number(ch.exam_weightage) > 0 && (
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/90 border border-slate-200 text-slate-600 font-normal shrink-0">
                                                                        {ch.exam_weightage}%
                                                                    </span>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                                                    <p className="font-bold">No saved chapters found for this subject.</p>
                                                    <p className="mt-0.5 text-amber-800">You can type the chapters or topics manually in the directive box below.</p>
                                                </div>
                                            )}

                                            {/* TOPICS IN SCOPE (SUB-SELECTION WITHIN CHOSEN CHAPTERS) */}
                                            {aiSelectedChapterIds.length > 0 && availableAiTopics.length > 0 && (
                                                <div className="pt-3 border-t border-slate-200/70 space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                                <BookMarked size={14} className="text-emerald-600" />
                                                                <span>Topics in Scope</span>
                                                            </span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                                                {aiSelectedTopicIds.length} of {availableAiTopics.length} Selected
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            {availableAiTopics.length > 4 && (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search topics..."
                                                                    value={aiTopicSearch}
                                                                    onChange={e => setAiTopicSearch(e.target.value)}
                                                                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-600 bg-white w-36"
                                                                />
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={handleAiSelectAllTopics}
                                                                className="text-emerald-700 hover:underline cursor-pointer"
                                                            >
                                                                Select All
                                                            </button>
                                                            <span className="text-slate-300">|</span>
                                                            <button
                                                                type="button"
                                                                onClick={handleAiClearTopics}
                                                                className="text-slate-500 hover:text-slate-800 cursor-pointer"
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                        {filteredAiTopics.map(tp => {
                                                            const isSelected = aiSelectedTopicIds.includes(tp.id)
                                                            const parentChapter = availableAiChapters.find(ch => ch.id === tp.chapter_node_id)
                                                            return (
                                                                <button
                                                                    key={tp.id}
                                                                    type="button"
                                                                    onClick={() => handleAiToggleTopic(tp.id)}
                                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer ${
                                                                        isSelected
                                                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold shadow-2xs'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                                                        isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                                                                    }`}>
                                                                        {isSelected && <Check size={10} />}
                                                                    </span>
                                                                    <span>{tp.name}</span>
                                                                    {parentChapter && (
                                                                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                                                            {parentChapter.name}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI PROMPT SCOPE PREVIEW & CUSTOM DIRECTIVES */}
                                            <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    Gemini AI Topic Directives & Extra Criteria
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    placeholder="Selected chapters will automatically appear here. You can add extra directives, e.g. 'Focus on numerical formulas, definitions, and diagram questions'..."
                                                    value={aiExamForm.topic}
                                                    onChange={e => setAiExamForm({ ...aiExamForm, topic: e.target.value })}
                                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[#004B93] focus:outline-none placeholder:text-slate-400 shadow-2xs"
                                                />
                                                <p className="text-[11px] text-slate-500">
                                                    This exact curriculum scope is passed to Gemini AI to author your questions, answer keys, and explanations.
                                                </p>
                                            </div>
                                        </div>

                                        {/* EXAM TITLE & CONFIG */}
                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                                    Exam Title <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Class 7 Science OMR Exam"
                                                    value={aiExamForm.title}
                                                    onChange={e => setAiExamForm({ ...aiExamForm, title: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#004B93] focus:outline-none shadow-xs text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Number of Questions</label>
                                                <select
                                                    value={aiExamForm.count}
                                                    onChange={e => setAiExamForm({ ...aiExamForm, count: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                                >
                                                    <option value={10}>10 Questions</option>
                                                    <option value={20}>20 Questions (Standard)</option>
                                                    <option value={30}>30 Questions</option>
                                                    <option value={40}>40 Questions</option>
                                                    <option value={50}>50 Questions</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Difficulty</label>
                                                <select
                                                    value={aiExamForm.difficulty}
                                                    onChange={e => setAiExamForm({ ...aiExamForm, difficulty: e.target.value as any })}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                                >
                                                    <option value="easy">Easy (Fundamentals)</option>
                                                    <option value="medium">Medium (Standard Board)</option>
                                                    <option value="hard">Hard (Advanced Thinking)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Duration (Minutes)</label>
                                                <input
                                                    type="number"
                                                    value={aiExamForm.duration}
                                                    onChange={e => setAiExamForm({ ...aiExamForm, duration: parseInt(e.target.value) || 30 })}
                                                    min={10}
                                                    max={180}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                disabled={aiLoading}
                                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                            >
                                                {aiLoading ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        <span>Generating Questions with Gemini AI...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={18} />
                                                        <span>Generate Questions & Answers</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* STEP 2: INLINE REVIEW & EDITING */}
                        {aiStep === 'review' && (
                            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                                <div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between px-6 sm:px-8">
                                    <div className="text-xs text-sky-900 font-medium">
                                        <span className="font-bold">Inline Editing Active:</span> Click any question or option text to edit. Click option badge <span className="font-bold">A, B, C, or D</span> to change the correct answer key.
                                    </div>
                                    <span className="text-xs font-black bg-white px-3 py-1 rounded-full text-[#004B93] border border-sky-200">
                                        {aiQuestions.length} Questions Ready
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                                    {aiQuestions.map((q, qIndex) => {
                                        const currentCorrect = (q.correct_answer || 'A').toUpperCase()
                                        return (
                                            <div key={qIndex} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-lg bg-[#004B93] text-white flex items-center justify-center font-bold text-xs">
                                                            {qIndex + 1}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question {qIndex + 1}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-500">Correct Answer:</span>
                                                        <div className="flex gap-1">
                                                            {(['A', 'B', 'C', 'D'] as const).map(optKey => (
                                                                <button
                                                                    key={optKey}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...aiQuestions]
                                                                        updated[qIndex].correct_answer = optKey
                                                                        setAiQuestions(updated)
                                                                    }}
                                                                    className={`w-7 h-7 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                                                        currentCorrect === optKey
                                                                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    {optKey}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (aiQuestions.length <= 1) {
                                                                    showToast('At least 1 question is required', false)
                                                                    return
                                                                }
                                                                setAiQuestions(aiQuestions.filter((_, idx) => idx !== qIndex))
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-2 cursor-pointer"
                                                            title="Delete question"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Editable Question Text */}
                                                <div>
                                                    <textarea
                                                        value={q.text}
                                                        rows={2}
                                                        onChange={e => {
                                                            const updated = [...aiQuestions]
                                                            updated[qIndex].text = e.target.value
                                                            setAiQuestions(updated)
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#004B93] focus:outline-none"
                                                    />
                                                </div>

                                                {/* 4 Editable Options */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                                    {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                                                        const isSelected = currentCorrect === optKey
                                                        return (
                                                            <div
                                                                key={optKey}
                                                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                                                    isSelected ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-white'
                                                                }`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...aiQuestions]
                                                                        updated[qIndex].correct_answer = optKey
                                                                        setAiQuestions(updated)
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
                                                                        const updated = [...aiQuestions]
                                                                        updated[qIndex].options[optKey] = e.target.value
                                                                        setAiQuestions(updated)
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

                                    {/* Add Another Question Button */}
                                    <div className="text-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAiQuestions([
                                                    ...aiQuestions,
                                                    {
                                                        id: `q${aiQuestions.length + 1}`,
                                                        text: 'New question statement',
                                                        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
                                                        correct_answer: 'A',
                                                        marks: 1
                                                    }
                                                ])
                                            }}
                                            className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#004B93] text-slate-600 hover:text-[#004B93] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <PlusCircle size={15} />
                                            <span>Add Question</span>
                                        </button>
                                    </div>
                                </div>

                                {/* REVIEW FOOTER */}
                                <div className="shrink-0 px-6 sm:px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAiStep('config')}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
                                    >
                                        Back to Settings
                                    </button>
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={handleApproveAndCreateAiExam}
                                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-950/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        <span>Approve & Save Exam</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SUCCESS & 1-CLICK COMBINED PRINT */}
                        {aiStep === 'success' && createdAiExam && (
                            <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 bg-white">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-lg">
                                    <CheckCircle size={36} />
                                </div>
                                <div className="max-w-md space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">Exam Created Successfully!</h3>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-bold text-slate-900">&quot;{createdAiExam.title}&quot;</span> has been saved with {aiQuestions.length} questions and an automated master answer key.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    {/* Primary 1-Click Unified Print */}
                                    <button
                                        onClick={() => window.open(`/api/dashboard/exams/omr/${createdAiExam.id}/print?mode=unified`, '_blank')}
                                        className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer"
                                    >
                                        <Printer size={18} />
                                        <span>Print Paper & OMR (Combined Booklet)</span>
                                    </button>

                                    {/* Print OMR Sheet Only */}
                                    <button
                                        onClick={() => window.open(`/api/dashboard/exams/omr/${createdAiExam.id}/print?mode=omr`, '_blank')}
                                        className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 transition-all cursor-pointer"
                                    >
                                        <span>Print OMR Sheet Only</span>
                                    </button>

                                    {/* Print Answer Key */}
                                    <button
                                        onClick={() => window.open(`/api/dashboard/exams/omr/${createdAiExam.id}/print?mode=key`, '_blank')}
                                        className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 transition-all cursor-pointer"
                                    >
                                        <span>Print Answer Key</span>
                                    </button>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAiExamModalOpen(false)
                                            fetchData()
                                        }}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                    >
                                        Return to Exam List
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* MODAL 3: BATCH INGESTION DRAWER */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Batch Feeder Ingestion</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Feed physical scans directly into the AI optical recognition engine.</p>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Target Physical Examination</label>
                                <select
                                    value={selectedExam?.id || ''}
                                    onChange={e => {
                                        const found = exams.find(x => x.id === e.target.value)
                                        setSelectedExam(found)
                                    }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                                >
                                    {exams.map(ex => (
                                        <option key={ex.id} value={ex.id}>{ex.title} ({ex.classes?.name || 'Class 10'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-sky-200 bg-sky-50/50 rounded-2xl p-8 text-center">
                                <UploadCloud size={40} className="mx-auto text-[#004B93] mb-3" />
                                <div className="font-bold text-slate-900 text-sm">Upload Multi-Page Scan PDF or Image Batch</div>
                                <div className="text-xs text-slate-500 mt-1">Supports ADF Scanners (Fujitsu, Epson, Canon, HP) up to 200 sheets</div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <span className="font-bold text-slate-700">Estimated Processing Speed:</span>
                                <span className="font-black text-sky-700">1,200 sheets / min (AI Engine)</span>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTriggerBatchScan}
                                    className="px-6 py-2.5 rounded-xl bg-[#004B93] hover:bg-sky-800 text-white font-bold shadow-md flex items-center gap-2"
                                >
                                    <ScanLine size={16} />
                                    <span>Initiate Batch Evaluation</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SaveIcon() {
    return <CheckCircle size={18} />
}

'use client'

import React, { useState, useMemo } from 'react'
import {
    BookOpen, Layers, CheckCircle2, ChevronDown, ChevronRight,
    UploadCloud, Sparkles, Filter, AlertCircle, FileSpreadsheet,
    Clock, Award, HelpCircle, Check, X, RefreshCw, Loader2, ArrowRight
} from 'lucide-react'
import * as XLSX from 'xlsx'

export interface BlueprintContextData {
    tenant: {
        id: string
        name: string
        multiBoardEnabled: boolean
    }
    activeBoards: Array<{
        id: string
        name: string
        source_type: 'owner_public' | 'manual' | 'excel'
        is_active: boolean
    }>
    syllabusTree: {
        classes: Array<{ id: string; name: string; board_id: string }>
        subjects: Array<{ id: string; name: string; class_node_id: string }>
        chapters: Array<{ id: string; name: string; subject_node_id: string; exam_weightage?: number; question_count?: number }>
        topics: Array<{ id: string; name: string; chapter_node_id: string }>
    }
    examPatterns: Array<{
        id: string
        name: string
        category: string
        exam_type: string
        duration_minutes: number
        total_marks: number
        instructions: string[] | string
        description?: string
        sections: Array<{
            id: string
            section_name: string
            section_type: string
            rules: Array<{
                id: string
                question_type: string
                num_questions: number
                marks_per_question: number
                negative_marks: number
                difficulty_easy_pct?: number
                difficulty_medium_pct?: number
                difficulty_hard_pct?: number
            }>
        }>
    }>
    ownerCatalog: Array<{
        id: string
        name: string
        classes_count: number
        subjects_count: number
        is_active_for_tenant: boolean
    }>
}

interface ExamSyllabusPatternPickerProps {
    context: BlueprintContextData | null
    loadingContext?: boolean
    onRefreshContext: () => Promise<void>
    selectedBoardId: string
    selectedClassId: string
    selectedSubjectId: string
    selectedChapterIds: string[]
    selectedTopicIds?: string[]
    selectedPatternId: string
    onSelectBoard: (boardId: string) => void
    onSelectClass: (classNode: { id: string; name: string }) => void
    onSelectSubject: (subjectNode: { id: string; name: string }) => void
    onSelectChapters: (chapterIds: string[]) => void
    onSelectTopics?: (topicIds: string[]) => void
    onSelectPattern: (pattern: any) => void
    hidePatternPicker?: boolean
    hideSyllabusPicker?: boolean
}

export default function ExamSyllabusPatternPicker({
    context,
    loadingContext = false,
    onRefreshContext,
    selectedBoardId,
    selectedClassId,
    selectedSubjectId,
    selectedChapterIds,
    selectedTopicIds = [],
    selectedPatternId,
    onSelectBoard,
    onSelectClass,
    onSelectSubject,
    onSelectChapters,
    onSelectTopics,
    onSelectPattern,
    hidePatternPicker = false,
    hideSyllabusPicker = false
}: ExamSyllabusPatternPickerProps) {
    const [showSyllabusManagerModal, setShowSyllabusManagerModal] = useState(false)
    const [managerTab, setManagerTab] = useState<'catalog' | 'excel'>('catalog')
    const [actionLoading, setActionLoading] = useState(false)
    const [actionMessage, setActionMessage] = useState<{ text: string; ok: boolean } | null>(null)
    const [patternCategoryFilter, setPatternCategoryFilter] = useState<string>('ALL')
    const [chapterSearch, setChapterSearch] = useState('')
    const [topicSearch, setTopicSearch] = useState('')

    // ── Active Board Resolution ──────────────────────────────────────────
    const activeBoard = useMemo(() => {
        if (!context?.activeBoards?.length) return null
        if (selectedBoardId) {
            return context.activeBoards.find(b => b.id === selectedBoardId) || context.activeBoards[0]
        }
        return context.activeBoards[0]
    }, [context?.activeBoards, selectedBoardId])

    // ── Available Classes for active board ────────────────────────────────
    const availableClasses = useMemo(() => {
        if (!context?.syllabusTree?.classes || !activeBoard) return []
        return context.syllabusTree.classes.filter(c => c.board_id === activeBoard.id)
    }, [context?.syllabusTree?.classes, activeBoard])

    // ── Available Subjects for selected class ─────────────────────────────
    const availableSubjects = useMemo(() => {
        if (!context?.syllabusTree?.subjects || !selectedClassId) return []
        return context.syllabusTree.subjects.filter(s => s.class_node_id === selectedClassId)
    }, [context?.syllabusTree?.subjects, selectedClassId])

    // ── Available Chapters for selected subject ───────────────────────────
    const availableChapters = useMemo(() => {
        if (!context?.syllabusTree?.chapters || !selectedSubjectId) return []
        return context.syllabusTree.chapters.filter(ch => ch.subject_node_id === selectedSubjectId)
    }, [context?.syllabusTree?.chapters, selectedSubjectId])

    // ── Available Topics for selected chapters ────────────────────────────
    const availableTopics = useMemo(() => {
        if (!context?.syllabusTree?.topics || selectedChapterIds.length === 0) return []
        return context.syllabusTree.topics.filter(tp => selectedChapterIds.includes(tp.chapter_node_id))
    }, [context?.syllabusTree?.topics, selectedChapterIds])

    // ── Filtered Chapters by search ───────────────────────────────────────
    const filteredChapters = useMemo(() => {
        if (!chapterSearch.trim()) return availableChapters
        return availableChapters.filter(ch => ch.name.toLowerCase().includes(chapterSearch.toLowerCase()))
    }, [availableChapters, chapterSearch])

    // ── Filtered Topics by search ─────────────────────────────────────────
    const filteredTopics = useMemo(() => {
        if (!topicSearch.trim()) return availableTopics
        return availableTopics.filter(tp => tp.name.toLowerCase().includes(topicSearch.toLowerCase()))
    }, [availableTopics, topicSearch])

    // ── Filtered Exam Patterns ────────────────────────────────────────────
    const patternCategories = useMemo(() => {
        if (!context?.examPatterns) return ['ALL']
        const cats = new Set(context.examPatterns.map(p => p.category).filter(Boolean))
        return ['ALL', ...Array.from(cats)]
    }, [context?.examPatterns])

    const filteredPatterns = useMemo(() => {
        if (!context?.examPatterns) return []
        if (patternCategoryFilter === 'ALL') return context.examPatterns
        return context.examPatterns.filter(p => p.category === patternCategoryFilter)
    }, [context?.examPatterns, patternCategoryFilter])

    // ── 1-Click Import Owner Public Syllabus ───────────────────────────────
    const handleImportOwnerBoard = async (boardId: string) => {
        setActionLoading(true)
        setActionMessage(null)
        try {
            const res = await fetch('/api/dashboard/exams/blueprint-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'IMPORT_OWNER_SYLLABUS',
                    payload: { board_id: boardId }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to import curriculum')

            await onRefreshContext()
            onSelectBoard(boardId)
            setActionMessage({ text: data.message || 'Curriculum imported successfully!', ok: true })
            setTimeout(() => {
                setShowSyllabusManagerModal(false)
                setActionMessage(null)
            }, 1200)
        } catch (e: any) {
            setActionMessage({ text: e.message || 'Failed to import', ok: false })
        } finally {
            setActionLoading(false)
        }
    }

    // ── Excel File Drop / Ingestion ────────────────────────────────────────
    const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setActionLoading(true)
        setActionMessage(null)

        try {
            const buffer = await file.arrayBuffer()
            const workbook = XLSX.read(buffer, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[firstSheetName]
            const parsedRows: any[] = XLSX.utils.sheet_to_json(sheet)

            if (!parsedRows || parsedRows.length === 0) {
                throw new Error('Spreadsheet has no readable data rows.')
            }

            const boardName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Imported Excel Curriculum'

            const res = await fetch('/api/dashboard/exams/blueprint-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPLOAD_EXCEL_SYLLABUS',
                    payload: {
                        board_name: boardName,
                        rows: parsedRows
                    }
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Excel import failed')

            await onRefreshContext()
            if (data.boardId) onSelectBoard(data.boardId)

            setActionMessage({ text: data.message || 'Spreadsheet curriculum imported!', ok: true })
            setTimeout(() => {
                setShowSyllabusManagerModal(false)
                setActionMessage(null)
            }, 1200)
        } catch (err: any) {
            setActionMessage({ text: err.message || 'Failed to parse Excel file', ok: false })
        } finally {
            setActionLoading(false)
            if (e.target) e.target.value = ''
        }
    }

    // ── Chapter Selection Toggles ─────────────────────────────────────────
    const handleToggleChapter = (chapterId: string) => {
        const isRemoving = selectedChapterIds.includes(chapterId)
        const nextChapterIds = isRemoving
            ? selectedChapterIds.filter(id => id !== chapterId)
            : [...selectedChapterIds, chapterId]
        onSelectChapters(nextChapterIds)

        // Sync topics for this chapter
        if (onSelectTopics && context?.syllabusTree?.topics) {
            const currentTopics = selectedTopicIds || []
            const chapterTopicIds = context.syllabusTree.topics
                .filter(tp => tp.chapter_node_id === chapterId)
                .map(tp => tp.id)

            if (isRemoving) {
                onSelectTopics(currentTopics.filter(id => !chapterTopicIds.includes(id)))
            } else {
                onSelectTopics([...new Set([...currentTopics, ...chapterTopicIds])])
            }
        }
    }

    const handleSelectAllChapters = () => {
        const allChapterIds = availableChapters.map(ch => ch.id)
        onSelectChapters(allChapterIds)
        if (onSelectTopics && context?.syllabusTree?.topics) {
            const allTopicIds = context.syllabusTree.topics
                .filter(tp => allChapterIds.includes(tp.chapter_node_id))
                .map(tp => tp.id)
            onSelectTopics(allTopicIds)
        }
    }

    const handleClearChapters = () => {
        onSelectChapters([])
        if (onSelectTopics) onSelectTopics([])
    }

    // ── Topic Selection Toggles (Multiple Choice) ─────────────────────────
    const handleToggleTopic = (topicId: string) => {
        if (!onSelectTopics) return
        const current = selectedTopicIds || []
        if (current.includes(topicId)) {
            onSelectTopics(current.filter(id => id !== topicId))
        } else {
            onSelectTopics([...current, topicId])
        }
    }

    const handleSelectAllTopics = () => {
        if (!onSelectTopics) return
        onSelectTopics(availableTopics.map(tp => tp.id))
    }

    const handleClearTopics = () => {
        if (!onSelectTopics) return
        onSelectTopics([])
    }

    return (
        <div className="space-y-6">
            {/* ════════════════════════════════════════════════════════════════════
                SECTION 1: SYLLABUS CURRICULUM SOURCING
            ════════════════════════════════════════════════════════════════════ */}
            {!hideSyllabusPicker && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                    {/* Header Strip with Source Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004B93] flex items-center justify-center">
                                <BookOpen size={18} />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900">Curriculum Sourcing & Syllabus Scope</h4>
                                <p className="text-xs text-slate-500">
                                    Bound to active institutional syllabus (Owner Public, Manual, or Excel).
                                </p>
                            </div>
                        </div>

                        {/* Source Status & Manager Trigger */}
                        <div className="flex items-center gap-2">
                            {activeBoard ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs">
                                    <span className={`w-2 h-2 rounded-full ${
                                        activeBoard.source_type === 'owner_public' ? 'bg-sky-500' :
                                        activeBoard.source_type === 'excel' ? 'bg-emerald-500' : 'bg-purple-500'
                                    }`} />
                                    <span className="text-slate-700">
                                        {activeBoard.name}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider ${
                                        activeBoard.source_type === 'owner_public' ? 'bg-sky-100 text-sky-800' :
                                        activeBoard.source_type === 'excel' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        {activeBoard.source_type === 'owner_public' ? 'Owner Public' :
                                         activeBoard.source_type === 'excel' ? 'Excel Import' : 'Manual'}
                                    </span>
                                </div>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertCircle size={13} /> No Active Board
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowSyllabusManagerModal(true)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#004B93] text-[#004B93] text-xs font-bold bg-slate-50/70 hover:bg-blue-50/50 transition-all flex items-center gap-1 cursor-pointer"
                                title="Change or Import Curriculum"
                            >
                                <RefreshCw size={12} className={loadingContext ? 'animate-spin' : ''} />
                                <span>Switch / Import</span>
                            </button>
                        </div>
                    </div>

                    {/* Warning if no active board exists */}
                    {!activeBoard && !loadingContext && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
                            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <p className="font-bold text-sm">No Active Curriculum Found</p>
                                <p className="text-amber-800 leading-relaxed">
                                    Please adopt a standard board from the Owner Public catalog or upload your Excel curriculum to populate classes, subjects, and chapters.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowSyllabusManagerModal(true)}
                                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Sparkles size={13} /> 1-Click Adopt Curriculum
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Cascading Board, Class & Subject Selectors */}
                    {context?.activeBoards && context.activeBoards.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Board Dropdown */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Curriculum Board / Origin
                                </label>
                                <select
                                    value={selectedBoardId || activeBoard?.id || ''}
                                    onChange={e => {
                                        onSelectBoard(e.target.value)
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    {context.activeBoards.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} {b.source_type === 'owner_public' ? '(Owner Public)' : b.source_type === 'excel' ? '(Excel)' : '(Custom)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Dropdown */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Target Class / Grade
                                </label>
                                <select
                                    value={selectedClassId}
                                    onChange={e => {
                                        const found = availableClasses.find(c => c.id === e.target.value)
                                        if (found) onSelectClass(found)
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                                >
                                    <option value="">-- Select Class --</option>
                                    {availableClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Dropdown */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Target Subject
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    disabled={!selectedClassId}
                                    onChange={e => {
                                        const found = availableSubjects.find(s => s.id === e.target.value)
                                        if (found) onSelectSubject(found)
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93] disabled:bg-slate-100 disabled:opacity-60"
                                >
                                    <option value="">{selectedClassId ? '-- Select Subject --' : '-- Choose Class First --'}</option>
                                    {availableSubjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Chapter Scope Selector (Multiple Choice) */}
                    {selectedSubjectId && availableChapters.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Filter size={13} className="text-[#004B93]" />
                                    <span>Chapters in Scope ({selectedChapterIds.length} of {availableChapters.length} selected)</span>
                                </span>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    {availableChapters.length > 6 && (
                                        <input
                                            type="text"
                                            placeholder="Search chapters..."
                                            value={chapterSearch}
                                            onChange={e => setChapterSearch(e.target.value)}
                                            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#004B93] w-36"
                                        />
                                    )}
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
                                        className="text-slate-500 hover:text-slate-800 cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Chapter Pills Grid (Multiple Choice) */}
                            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
                                {filteredChapters.map(ch => {
                                    const isSelected = selectedChapterIds.includes(ch.id)
                                    return (
                                        <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => handleToggleChapter(ch.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-blue-50 text-[#004B93] border-[#004B93] font-bold shadow-2xs'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                                isSelected ? 'bg-[#004B93] text-white' : 'border border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <Check size={10} />}
                                            </span>
                                            <span>{ch.name}</span>
                                            {ch.exam_weightage && Number(ch.exam_weightage) > 0 && (
                                                <span className="text-[10px] px-1 py-0.2 bg-white/80 rounded border border-slate-200 text-slate-600">
                                                    {ch.exam_weightage}%
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Topic Scope Selector (Multiple Choice) */}
                    {selectedChapterIds.length > 0 && availableTopics.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <BookOpen size={13} className="text-emerald-600" />
                                    <span>Topics in Scope ({selectedTopicIds.length} of {availableTopics.length} selected)</span>
                                </span>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    {availableTopics.length > 6 && (
                                        <input
                                            type="text"
                                            placeholder="Search topics..."
                                            value={topicSearch}
                                            onChange={e => setTopicSearch(e.target.value)}
                                            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-600 w-36"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSelectAllTopics}
                                        className="text-emerald-700 hover:underline cursor-pointer"
                                    >
                                        Select All Topics
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        type="button"
                                        onClick={handleClearTopics}
                                        className="text-slate-500 hover:text-slate-800 cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Topic Pills Grid (Multiple Choice) */}
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                {filteredTopics.map(tp => {
                                    const isSelected = selectedTopicIds.includes(tp.id)
                                    const parentChapter = availableChapters.find(ch => ch.id === tp.chapter_node_id)
                                    return (
                                        <button
                                            key={tp.id}
                                            type="button"
                                            onClick={() => handleToggleTopic(tp.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold shadow-2xs'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                                isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <Check size={10} />}
                                            </span>
                                            <span>{tp.name}</span>
                                            {parentChapter && (
                                                <span className="text-[10px] px-1.5 py-0.2 bg-white/90 rounded border border-slate-200 text-slate-500">
                                                    {parentChapter.name}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                SECTION 2: OWNER PUBLIC EXAM PATTERN BLUEPRINTS
            ════════════════════════════════════════════════════════════════════ */}
            {!hidePatternPicker && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <Layers size={18} />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900">Standard Board Exam Pattern</h4>
                                <p className="text-xs text-slate-500">
                                    Fetched live from official Owner Public exam pattern registry.
                                </p>
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {patternCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setPatternCategoryFilter(cat)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        patternCategoryFilter === cat
                                            ? 'bg-[#004B93] text-white shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pattern Cards Carousel / Grid */}
                    {filteredPatterns.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            No exam patterns matching "{patternCategoryFilter}" found.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-80 overflow-y-auto pr-1">
                            {filteredPatterns.map(pt => {
                                const isSelected = selectedPatternId === pt.id
                                const totalQuestions = pt.sections?.reduce(
                                    (acc, s) => acc + (s.rules?.reduce((ra, r) => ra + Number(r.num_questions || 0), 0) || 0), 0
                                ) || 0

                                return (
                                    <div
                                        key={pt.id}
                                        onClick={() => onSelectPattern(pt)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                                ? 'bg-blue-50/70 border-[#004B93] ring-2 ring-[#004B93]/20 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="font-extrabold text-sm text-slate-900 leading-snug">
                                                    {pt.name}
                                                </div>
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-[#004B93] text-white' : 'border border-slate-300'
                                                }`}>
                                                    {isSelected && <Check size={11} />}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                                    {pt.category || 'School'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-[#004B93] font-bold">
                                                    {pt.exam_type}
                                                </span>
                                            </div>

                                            {pt.description && (
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                    {pt.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} className="text-slate-400" />
                                                {pt.duration_minutes} Mins
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-slate-900">
                                                <Award size={12} className="text-amber-500" />
                                                {pt.total_marks} Marks
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                {totalQuestions > 0 ? `${totalQuestions} Qs` : `${pt.sections?.length || 0} Secs`}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                INLINE MODAL: SWITCH / IMPORT SYLLABUS MANAGER
            ════════════════════════════════════════════════════════════════════ */}
            {showSyllabusManagerModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
                    <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Curriculum Sourcing Hub</h3>
                                <p className="text-xs text-slate-500">
                                    Adopt standard public curriculum or import custom Excel spreadsheet.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSyllabusManagerModal(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setManagerTab('catalog')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    managerTab === 'catalog' ? 'bg-[#004B93] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Sparkles size={14} />
                                <span>Owner Public Catalog ({context?.ownerCatalog?.length || 0})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setManagerTab('excel')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    managerTab === 'excel' ? 'bg-[#004B93] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <FileSpreadsheet size={14} />
                                <span>Excel / CSV Spreadsheet Upload</span>
                            </button>
                        </div>

                        {/* Action Banner */}
                        {actionMessage && (
                            <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                actionMessage.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                                {actionMessage.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <span>{actionMessage.text}</span>
                            </div>
                        )}

                        {/* TAB 1: OWNER PUBLIC CATALOG */}
                        {managerTab === 'catalog' && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 font-medium">
                                    Select an official curriculum to automatically synchronize institutional classes, subjects, and chapters:
                                </p>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {(!context?.ownerCatalog || context.ownerCatalog.length === 0) ? (
                                        <div className="text-center py-8 text-xs text-slate-400">
                                            No Owner Public Syllabuses available in catalog.
                                        </div>
                                    ) : (
                                        context.ownerCatalog.map(board => (
                                            <div
                                                key={board.id}
                                                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 flex items-center justify-between gap-3 transition-colors"
                                            >
                                                <div>
                                                    <div className="font-extrabold text-sm text-slate-900">
                                                        {board.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                        <span>{board.classes_count} Classes</span>
                                                        <span>•</span>
                                                        <span>{board.subjects_count} Subjects</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={actionLoading}
                                                    onClick={() => handleImportOwnerBoard(board.id)}
                                                    className="px-3.5 py-1.5 rounded-xl bg-[#004B93] hover:bg-blue-800 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    <span>1-Click Adopt</span>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: EXCEL SPREADSHEET UPLOAD */}
                        {managerTab === 'excel' && (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-sky-200 bg-sky-50/50 rounded-2xl p-7 text-center space-y-3">
                                    <UploadCloud size={40} className="mx-auto text-[#004B93]" />
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Upload Excel Spreadsheet (.xlsx, .xls, .csv)</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            Must include columns: <code className="font-mono bg-white px-1 py-0.5 rounded text-sky-800">Class</code>, <code className="font-mono bg-white px-1 py-0.5 rounded text-sky-800">Subject</code>, <code className="font-mono bg-white px-1 py-0.5 rounded text-sky-800">Chapter</code>, and optional <code className="font-mono bg-white px-1 py-0.5 rounded text-sky-800">Topic</code>.
                                        </div>
                                    </div>
                                    <div>
                                        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004B93] hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-sm">
                                            {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                                            <span>{actionLoading ? 'Processing Spreadsheet...' : 'Select Spreadsheet File'}</span>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                className="hidden"
                                                disabled={actionLoading}
                                                onChange={handleExcelFileUpload}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { 
    BookOpen, 
    ChevronRight, 
    ChevronDown, 
    RefreshCcw, 
    Search, 
    Plus,
    CheckCircle2,
    AlertCircle,
    Brain,
    GraduationCap,
    Trophy,
    Target
} from 'lucide-react'
import { clsx } from 'clsx'

interface SyllabusNode {
    id: string
    name: string
    type: 'category' | 'board' | 'exam' | 'class' | 'subject' | 'chapter' | 'topic'
    parent_id: string | null
    metadata: any
}

export default function MasterSyllabusPage() {
    const [nodes, setNodes] = useState<SyllabusNode[]>([])
    const [expanded, setExpanded] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        fetchNodes()
    }, [])

    const fetchNodes = async () => {
        try {
            const res = await fetch('/api/admin/master-syllabus')
            const data = await res.json()
            setNodes(data)
        } catch (error) {
            console.error('Failed to fetch syllabus nodes:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (id: string) => {
        setExpanded(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            // In a real app, this would call a background job
            await new Promise(r => setTimeout(r, 2000))
            alert('AI Sync started in background. Refresh in a few minutes.')
        } finally {
            setSyncing(false)
        }
    }

    const renderNode = (parentId: string | null, depth = 0) => {
        const children = nodes.filter(n => n.parent_id === parentId)
        
        return children.map(node => (
            <div key={node.id} className="ml-4">
                <div 
                    className={clsx(
                        "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group",
                        depth === 0 ? "bg-white/5 border border-white/10 mb-2" : "mb-1"
                    )}
                    onClick={() => toggleExpand(node.id)}
                >
                    {nodes.some(n => n.parent_id === node.id) ? (
                        expanded.includes(node.id) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                        <div className="w-4" />
                    )}
                    
                    {node.type === 'category' && <BookOpen className="w-4 h-4 text-blue-400" />}
                    {node.type === 'board' && <GraduationCap className="w-4 h-4 text-purple-400" />}
                    {node.type === 'exam' && <Target className="w-4 h-4 text-orange-400" />}
                    {node.type === 'subject' && <Brain className="w-4 h-4 text-green-400" />}
                    
                    <span className={clsx(
                        "flex-1 font-medium",
                        depth === 0 ? "text-lg text-white" : "text-sm text-gray-300"
                    )}>
                        {node.name}
                    </span>

                    {node.type === 'board' && (
                        <button 
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                            title="Regenerate with AI"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSync()
                            }}
                        >
                            <RefreshCcw className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                    )}
                </div>
                
                {expanded.includes(node.id) && renderNode(node.id, depth + 1)}
            </div>
        ))
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-blue-500" />
                            Master Syllabus Management
                        </h1>
                        <p className="text-gray-400">Manage and AI-generate canonical syllabus across boards and exams</p>
                    </div>
                    <button 
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Brain className={clsx("w-5 h-5", syncing && "animate-pulse")} />
                        {syncing ? 'Syncing...' : 'Deep AI Sync'}
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Search syllabus..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Boards</span>
                                    <span className="text-white font-mono">12</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Exams</span>
                                    <span className="text-white font-mono">24</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">AI Coverage</span>
                                    <span className="text-green-400 font-mono">85%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[600px]">
                                {renderNode(null)}
                                {nodes.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 italic">
                                        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                                        No syllabus data seeded yet. Run the AI Sync to populate.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

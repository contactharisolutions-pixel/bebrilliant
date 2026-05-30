'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    MessageSquare, Send, Search, Users, Settings, Plus,
    MoreVertical, CheckCheck, Paperclip, Smile, Zap, Bell, Loader2,
    Shield, Globe, Radio, User, FileText, Image as ImageIcon,
    BarChart3, Activity, Clock, ShieldAlert, Cpu, Share2,
    ChevronRight, ArrowLeft, Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
// ── TYPES ────────────────────────────────────────────────
type Contact = { 
    id: string; 
    name: string; 
    sub: string; 
    unread: number; 
    online: boolean; 
    type: 'group' | 'individual'; 
    meta?: any; 
}
type Message = { 
    id: string; 
    content: string; 
    created_at: string; 
    sender_id: string; 
    sent?: boolean; 
    status: 'sent' | 'delivered' | 'read'; 
    msg_type: string; 
    is_bulk?: boolean;
}
const COLORS = {
    primary: '#004B93',
    primaryGradient: 'linear-gradient(135deg, #004B93 0%, #002D58 100%)',
    success: '#1FAC63',
    warning: '#F0A026',
    danger: '#EF4444',
    slate: '#64748B',
    border: '#E2E8F0',
    background: '#F8FAFC',
    glass: 'rgba(255, 255, 255, 0.8)'
}
export default function Messages() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [msg, setMsg] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isBulk, setIsBulk] = useState(false)
    const [showSearchModal, setShowSearchModal] = useState(false)
    const [showHeaderMenu, setShowHeaderMenu] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const chatEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()
    const fetchInitial = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
            const res = await fetch('/api/dashboard/messages')
            const data = await res.json()
            if (res.ok) {
                const { profiles } = data
                const teacherProfile = profiles.find((p: any) => p.id === user?.id) || {}
                const assigned = teacherProfile.metadata?.assigned_classes || ['Std 12-A', 'Std 11-B']
                const groupContacts: Contact[] = assigned.map((g: string) => ({
                    id: `group_${g}`,
                    name: `Omni-Channel: Physics ${g}`,
                    sub: 'Bulk Message Broadcast',
                    unread: 0,
                    online: true,
                    type: 'group',
                    meta: { group_id: g }
                }))
                const individualContacts: Contact[] = profiles.filter((p: any) => p.id !== user?.id && p.role !== 'student').map((p: any) => ({
                    id: p.id,
                    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Internal Node',
                    sub: p.role.toUpperCase() + ' • Direct Link',
                    unread: 0,
                    online: Math.random() > 0.5,
                    type: 'individual'
                }))
                const all = [...groupContacts, ...individualContacts]
                setContacts(all)
                if (all.length > 0) setSelectedId(all[0].id)
            }
        } catch (e) {
            console.error('Initialization Error:', e)
        } finally { setLoading(false) }
    }
    const fetchMessages = useCallback(async () => {
        if (!selectedId) return
        try {
            const sel = contacts.find(c => c.id === selectedId)
            const params = sel?.type === 'group' ? `groupId=${sel.meta.group_id}` : `contactId=${selectedId}`
            const res = await fetch(`/api/dashboard/messages?${params}`)
            const data = await res.json()
            if (res.ok) {
                setMessages(data.map((m: any) => ({
                    ...m,
                    sent: m.sender_id === currentUser?.id
                })))
            }
        } catch (e) { console.error('Signal Interruption:', e) }
    }, [selectedId, contacts, currentUser])
    useEffect(() => {
        fetchInitial()
    }, [])
    useEffect(() => {
        fetchMessages()
        const inv = setInterval(fetchMessages, 10000)
        return () => clearInterval(inv)
    }, [fetchMessages])
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])
    const handleSend = async () => {
        if (!msg.trim() || !selectedId) return
        setSending(true)
        try {
            const sel = contacts.find(c => c.id === selectedId)
            const payload = {
                content: msg,
                msg_type: isBulk ? 'notification' : 'text',
                is_bulk: isBulk,
                group_id: sel?.type === 'group' ? sel.meta.group_id : null,
                recipient_id: sel?.type === 'individual' ? sel.id : null
            }
            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SEND_MESSAGE', payload })
            })
            if (res.ok) {
                setMsg('')
                fetchMessages()
            }
        } finally { setSending(false) }
    }
    const sel = contacts.find(c => c.id === selectedId)
    return (
        <div style={{ height: 'calc(100vh - 10px)', display: 'flex', background: COLORS.background, fontFamily: 'Inter, system-ui, sans-serif', padding: 12 }}>
            <style>{`
                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(31, 172, 99, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(31, 172, 99, 0); } 100% { box-shadow: 0 0 0 0 rgba(31, 172, 99, 0); } }
                @keyframes float { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes alertPulse { 0% { border-color: #EF4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { border-color: #EF4444; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { border-color: #EF4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .chat-bubble-sent { background: ${COLORS.primaryGradient}; color: #FFF; border-radius: 20px 20px 4px 20px; box-shadow: 0 4px 15px rgba(0, 75, 147, 0.1); }
                .chat-bubble-received { background: #FFF; color: #1E293B; border-radius: 20px 20px 20px 4px; border: 1px solid #E2E8F0; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}</style>
            {/* 1. COMMUNICATIONS DIRECTORY (LEFT) */}
            <div style={{ width: 380, background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', marginRight: 12 }}>
                <div style={{ padding: '32px 24px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.03em' }}>Contacts</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>Communication Center</p>
                        </div>
                        <button onClick={() => setShowSearchModal(true)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}>
                            <Plus size={20} color={COLORS.primary} />
                        </button>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
                        <Search size={18} color="#94A3B8" />
                        <input type="text" placeholder="Search contacts..." style={{ flex: 1, border: 'none', background: 'transparent', padding: '14px 0', fontSize: 14, fontWeight: 600, outline: 'none' }} />
                    </div>
                </div>
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                    {loading ? (
                        <div style={{ padding: 60, textAlign: 'center' }}><Loader2 size={32} className="spin" color={COLORS.primary} /></div>
                    ) : contacts.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => setSelectedId(c.id)}
                            style={{ 
                                padding: '20px 16px', borderRadius: 20, cursor: 'pointer', marginBottom: 6,
                                background: selectedId === c.id ? `${COLORS.primary}08` : 'transparent',
                                border: `1px solid ${selectedId === c.id ? `${COLORS.primary}20` : 'transparent'}`,
                                display: 'flex', gap: 16, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 52, height: 52, borderRadius: 18, background: c.type === 'group' ? '#F5F3FF' : '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {c.type === 'group' ? <Radio size={24} color="#6366F1" /> : <User size={24} color="#64748B" />}
                                </div>
                                {c.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, background: COLORS.success, border: '3px solid #FFF', borderRadius: '50%', animation: 'pulse 2s infinite' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                    <Clock size={12} color="#CBD5E1" />
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.type === 'group' ? '#6366F1' : '#94A3B8' }} /> {c.sub}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* 2. BRIDGE INTERFACE (CENTER) */}
            <div style={{ flex: 1, background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                {/* MSG HEADER */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             {sel?.type === 'group' ? <Globe size={22} color={COLORS.primary} /> : <Shield size={22} color={COLORS.primary} />}
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{sel?.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: COLORS.success }}>
                                <div style={{ width: 8, height: 8, background: COLORS.success, borderRadius: '50%', animation: 'pulse 2s infinite' }} /> Online
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                         {sel?.type === 'group' && (
                            <button onClick={() => setIsBulk(!isBulk)} style={{ padding: '10px 20px', borderRadius: 14, background: isBulk ? `${COLORS.danger}08` : '#F8FAFC', border: `1px solid ${isBulk ? COLORS.danger : '#E2E8F0'}`, color: isBulk ? COLORS.danger : '#475569', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, animation: isBulk ? 'alertPulse 1.5s infinite' : 'none' }}>
                                <Bell size={16} /> {isBulk ? 'BROADCAST ACTIVE' : 'BROADCAST MODE'}
                            </button>
                        )}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} style={{ padding: 12, borderRadius: 14, background: showHeaderMenu ? `${COLORS.primary}08` : '#F8FAFC', border: `1px solid ${showHeaderMenu ? COLORS.primary : '#E2E8F0'}`, cursor: 'pointer', transition: '0.2s' }}>
                                <MoreVertical size={20} color={showHeaderMenu ? COLORS.primary : '#64748B'} />
                            </button>
                            {showHeaderMenu && (
                                <div style={{ position: 'absolute', top: '120%', right: 0, width: 220, background: '#FFF', borderRadius: 18, border: `1px solid ${COLORS.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 100, padding: 8, animation: 'float 0.2s ease-out' }}>
                                    {[
                                        { icon: Shield, label: 'Security Audit' },
                                        { icon: BarChart3, label: 'Analytics' },
                                        { icon: Clock, label: 'Message History' },
                                        { icon: Trash2, label: 'Delete Chat', color: COLORS.danger }
                                    ].map((item, i) => (
                                        <button key={i} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <item.icon size={16} color={item.color || COLORS.slate} />
                                            <span style={{ fontSize: 13, fontWeight: 800, color: item.color || '#1E293B' }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* SIGNAL FEED */}
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#FBFDFF', display: 'flex', flexDirection: 'column', gap: 20 }}>
                     {messages.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                            <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid #E2E8F0' }}>
                                <Cpu size={48} color="#94A3B8" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 1000, color: '#0F172A' }}>No Chat Selected</h3>
                            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748B', fontWeight: 600 }}>Select a contact to start messaging.</p>
                        </div>
                    ) : messages.map((m, i) => (
                        <div key={m.id} style={{ alignSelf: m.sent ? 'flex-end' : 'flex-start', maxWidth: '75%', animation: 'float 0.4s ease-out' }}>
                            {m.is_bulk && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: COLORS.danger, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>
                                    <ShieldAlert size={12} /> Priority Broadcast
                                </div>
                            )}
                            <div className={m.sent ? 'chat-bubble-sent' : 'chat-bubble-received'} style={{ padding: '16px 20px', fontSize: 15, fontWeight: m.sent ? 700 : 600, lineHeight: 1.6 }}>
                                {m.content}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: m.sent ? 'flex-end' : 'flex-start', gap: 8, marginTop: 8, fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {m.sent && <CheckCheck size={14} color={m.status === 'read' ? COLORS.primary : '#CBD5E1'} />}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                {/* SIGNAL TRANSMITTER */}
                <div style={{ padding: '24px 32px', background: '#FFF', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ background: '#F8FAFC', border: `2px solid ${isBulk ? COLORS.danger + '40' : '#E2E8F0'}`, borderRadius: 20, padding: 8, display: 'flex', gap: 12, alignItems: 'center', transition: '0.3s' }}>
                        <button style={{ padding: 12, borderRadius: 14, background: '#FFF', border: '1px solid #E2E8F0', cursor: 'pointer' }}><Paperclip size={20} color="#64748B" /></button>
                        <input 
                            type="text" 
                            value={msg} 
                            onChange={e => setMsg(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={isBulk ? "Draft broadcast message..." : "Type a message..."} 
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#0F172A' }} 
                        />
                         <button style={{ padding: 12, border: 'none', background: 'transparent', cursor: 'pointer' }}><Smile size={20} color="#64748B" /></button>
                         <button 
                            onClick={handleSend}
                            disabled={!msg.trim() || sending}
                            style={{ 
                                padding: '12px 28px', borderRadius: 16, border: 'none',
                                background: !msg.trim() ? '#E2E8F0' : (isBulk ? COLORS.danger : COLORS.primaryGradient),
                                color: '#FFF', fontSize: 14, fontWeight: 900, cursor: !msg.trim() ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10, boxShadow: !msg.trim() ? 'none' : '0 10px 20px rgba(0,0,0,0.1)'
                            }}
                        >
                            {sending ? <Loader2 size={18} className="spin" /> : <Send size={18} />} Send
                        </button>
                    </div>
                </div>
            </div>
            {/* 3. SIGNAL ANALYTICS (RIGHT) */}
            <div style={{ width: 340, background: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', marginLeft: 12, padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 100, height: 100, borderRadius: 32, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
                         {sel?.type === 'group' ? <Globe size={48} color={COLORS.primary} /> : <User size={48} color={COLORS.primary} />}
                         <div style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, background: COLORS.success, border: '4px solid #FFF', borderRadius: '50%' }} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A', letterSpacing: '-0.02em' }}>{sel?.name}</h3>
                    <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginTop: 6 }} >{sel?.sub}</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                     <div style={{ padding: 20, background: '#F1F5F960', border: '1px solid #F1F5F9', borderRadius: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Chat Info</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { icon: Activity, label: 'Response Rate', val: '98%' },
                                { icon: Users, label: 'Participants', val: '142' },
                                { icon: BarChart3, label: 'Activity Level', val: 'Low' }
                            ].map((stat, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#475569' }}>
                                        <stat.icon size={16} color={COLORS.primary} /> {stat.label}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>{stat.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                         <button onClick={() => router.push('/dashboard/material')} style={{ padding: 16, borderRadius: 18, background: '#FFF', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}>
                            <FileText size={20} color={COLORS.slate} />
                            <span style={{ fontSize: 11, fontWeight: 800 }}>Repository</span>
                        </button>
                        <button onClick={() => router.push('/dashboard/material?type=video')} style={{ padding: 16, borderRadius: 18, background: '#FFF', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.primary}>
                            <ImageIcon size={20} color={COLORS.slate} />
                            <span style={{ fontSize: 11, fontWeight: 800 }}>Media Hub</span>
                        </button>
                    </div>
                </div>
                <div style={{ background: isBulk ? `${COLORS.danger}08` : `${COLORS.warning}08`, border: `1px solid ${isBulk ? COLORS.danger : COLORS.warning}20`, borderRadius: 24, padding: 24, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <ShieldAlert size={18} color={isBulk ? COLORS.danger : COLORS.warning} />
                        <span style={{ fontSize: 12, fontWeight: 1000, color: isBulk ? COLORS.danger : COLORS.warning, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Check</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                        {isBulk 
                            ? "CRITICAL: Broadcasts go to all participants. Use only for important announcements."
                            : "Direct messages are secured and monitored for compliance."}
                    </p>
                </div>
            </div>
            {/* SEARCH & NEW CHAT MODAL */}
            {showSearchModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000 }}>
                    <div style={{ background: '#FFF', padding: 32, borderRadius: 28, width: 480, boxShadow: '0 40px 80px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.8)', animation: 'float 0.3s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 1000, color: '#0F172A' }}>New Message</h2>
                            <button onClick={() => setShowSearchModal(false)} style={{ background: '#F1F5F9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}><ChevronRight size={18} /></button>
                        </div>
                        <div style={{ background: '#F8FAFC', borderRadius: 16, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, marginBottom: 20 }}>
                            <Search size={18} color="#94A3B8" />
                            <input 
                                type="text" 
                                placeholder="Search staff..." 
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value)
                                    // Local filter on existing non-student contacts for now
                                    const filtered = contacts.filter(c => c.name.toLowerCase().includes(e.target.value.toLowerCase()))
                                    setSearchResults(filtered)
                                }}
                                style={{ flex: 1, border: 'none', background: 'transparent', padding: '16px 0', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                            />
                        </div>
                        <div className="custom-scrollbar" style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {(searchQuery ? searchResults : contacts).map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => {
                                        setSelectedId(c.id)
                                        setShowSearchModal(false)
                                    }}
                                    style={{ padding: '14px 16px', borderRadius: 14, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', transition: '0.2s', marginBottom: 4 }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                        {c.type === 'group' ? <Radio size={18} color={COLORS.primary} /> : <User size={18} color={COLORS.primary} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{c.name}</div>
                                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{c.sub}</div>
                                    </div>
                                    <ChevronRight size={16} color="#CBD5E1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

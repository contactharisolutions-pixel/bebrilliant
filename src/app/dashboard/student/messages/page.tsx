'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
    MessagesSquare, Send, Search, User, 
    MoreVertical, Info, Bell, Phone, Video,
    Loader2, Sparkles, CheckCheck, MessageCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useIdentity } from '@/contexts/IdentityContext'

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

export default function StudentInbox() {
    const { identity } = useIdentity()
    const role = identity?.role
    
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [msg, setMsg] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    
    const chatEndRef = useRef<HTMLDivElement>(null)
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
                
                // Identify class group from student metadata
                const studentProfile = profiles.find((p: any) => p.id === user?.id) || {}
                const assigned = studentProfile.metadata?.assigned_classes || 
                                 (identity?.metadata as any)?.school_class ? [(identity?.metadata as any).school_class] : ['Std 10-A']
                
                const groupContacts: Contact[] = assigned.map((g: string) => ({
                    id: `group_${g}`,
                    name: `Class Channel: ${g}`,
                    sub: 'Official Class Broadcasts',
                    unread: 0,
                    online: true,
                    type: 'group',
                    meta: { group_id: g }
                }))

                // Teachers and Admins are valid individual contacts
                const individualContacts: Contact[] = profiles
                    .filter((p: any) => p.id !== user?.id && ['admin', 'teacher', 'tenant_admin', 'owner'].includes(p.role))
                    .map((p: any) => ({
                        id: p.id,
                        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Faculty Member',
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
        } finally { 
            setLoading(false) 
        }
    }

    useEffect(() => {
        fetchInitial()
    }, [identity])

    const fetchMessages = useCallback(async () => {
        if (!selectedId) return
        try {
            const sel = contacts.find(c => c.id === selectedId)
            if (!sel) return
            const params = sel.type === 'group' ? `groupId=${sel.meta.group_id}` : `contactId=${selectedId}`
            const res = await fetch(`/api/dashboard/messages?${params}`)
            const list = await res.json()
            if (res.ok) {
                setMessages(list || [])
            }
        } catch (e) {
            console.error('Error fetching chat messages:', e)
        }
    }, [selectedId, contacts])

    useEffect(() => {
        fetchMessages()
        // Simple polling for new messages every 8 seconds
        const poll = setInterval(fetchMessages, 8000)
        return () => clearInterval(poll)
    }, [selectedId, fetchMessages])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!msg.trim() || !selectedId || sending) return
        setSending(true)
        try {
            const sel = contacts.find(c => c.id === selectedId)
            const payload: any = {
                content: msg,
                msg_type: 'text'
            }
            if (sel?.type === 'group') {
                payload.group_id = sel.meta.group_id
            } else {
                payload.recipient_id = selectedId
            }

            const res = await fetch('/api/dashboard/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SEND_MESSAGE',
                    payload
                })
            })
            if (res.ok) {
                setMsg('')
                await fetchMessages()
            }
        } catch (e) {
            console.error('Failed to transmit message:', e)
        } finally {
            setSending(false)
        }
    }

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const activeChat = contacts.find(c => c.id === selectedId)

    if (loading) return <div style={{ padding: 100, textAlign: 'center' }}><Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} /></div>

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: '#F8FAFC', overflow: 'hidden' }}>
            
            {/* CHAT SIDEBAR */}
            <div style={{ width: 380, background: '#FFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ padding: '32px 24px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: 100, fontSize: 11, fontWeight: 1000, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <MessageCircle size={14} fill="var(--color-primary)" stroke="none" /> Official Communications
                            </div>
                            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Messages & Notices</h1>
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={20} color="var(--color-primary)" />
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                        <input 
                            type="text" 
                            placeholder="Search messages..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '12px 16px 12px 48px', width: '100%', borderRadius: 16, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                    {filteredContacts.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8' }}>
                            <MessagesSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <div style={{ fontSize: 14, fontWeight: 700 }}>No messages yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Your faculty communications will appear here.</div>
                        </div>
                    ) : filteredContacts.map(chat => (
                        <button 
                            key={chat.id}
                            onClick={() => setSelectedId(chat.id)}
                            style={{ 
                                width: '100%', display: 'flex', gap: 16, padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer',
                                background: selectedId === chat.id ? 'var(--color-primary-bg)' : 'transparent',
                                transition: 'all 0.1s', marginBottom: 4, textAlign: 'left'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                 <div style={{ width: 52, height: 52, background: chat.type === 'group' ? 'var(--color-primary-gradient)' : '#10B981', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 900, boxShadow: chat.type === 'group' ? 'var(--shadow-primary)' : '0 4px 10px rgba(16,185,129,0.2)' }}>
                                    {chat.name?.charAt(0) || 'F'}
                                </div>
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: chat.online ? '#10B981' : '#94A3B8', border: '3px solid #FFF', borderRadius: '50%' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{chat.name}</div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {chat.sub}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* WINDOW HEADER */}
                {activeChat ? (
                    <div style={{ height: 100, background: '#FFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 44, height: 44, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={22} color="#64748B" />
                            </div>
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{activeChat.name}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: activeChat.online ? '#10B981' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeChat.online ? '#10B981' : '#94A3B8' }} />
                                    {activeChat.online ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => alert('Audio channels currently reserved for scheduled classroom blocks.')} style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', cursor: 'pointer' }}><Phone size={18} /></button>
                            <button onClick={() => alert('Video transmission disabled. Contact Administrator for hardware configuration.')} style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', cursor: 'pointer' }}><Video size={18} /></button>
                            <button style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                        </div>
                    </div>
                ) : (
                    <div style={{ height: 100, background: '#FFF', borderBottom: '1px solid #E2E8F0' }} />
                )}

                {/* MESSAGES FEED */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: '#F8FAFC' }}>
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <div style={{ display: 'inline-block', padding: '6px 16px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 20, fontSize: 11, fontWeight: 900, color: '#94A3B8' }}>SECURE CHANNEL ENCRYPTED</div>
                    </div>

                    {messages.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
                            <MessagesSquare size={48} style={{ marginBottom: 12 }} />
                            <div style={{ fontSize: 14, fontWeight: 700 }}>No Messages in this Thread</div>
                        </div>
                    ) : messages.map((msg, i) => {
                        const isMe = msg.sender_id === currentUser?.id
                        return (
                            <div key={msg.id || i} style={{ 
                                maxWidth: '70%', 
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                display: 'flex', flexDirection: 'column', gap: 8
                            }}>
                                <div style={{ 
                                    padding: '16px 24px', 
                                    borderRadius: isMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                                    background: isMe ? 'var(--color-primary-gradient)' : '#FFF',
                                    color: isMe ? '#FFF' : '#0F172A',
                                    fontSize: 15, fontWeight: 600, lineHeight: 1.6,
                                    boxShadow: isMe ? 'var(--shadow-primary)' : '0 1px 2px rgba(0,0,0,0.02)',
                                    border: isMe ? 'none' : '1px solid #E2E8F0'
                                }}>
                                    {msg.content}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: '#94A3B8', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && <CheckCheck size={14} color="#10B981" />}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* INPUT AREA */}
                {activeChat?.type === 'group' && role !== 'admin' && role !== 'teacher' && role !== 'tenant_admin' && role !== 'owner' ? (
                    <div style={{ height: 120, background: '#FFF', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 14, fontWeight: 600 }}>
                        This channel is read-only for students and parents. Only authorized faculty can broadcast.
                    </div>
                ) : (
                    <div style={{ height: 120, background: '#FFF', borderTop: '1px solid #E2E8F0', padding: '0 40px', display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Type your message..." 
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                style={{ width: '100%', height: 60, padding: '0 24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, fontSize: 15, fontWeight: 600, color: '#0F172A' }}
                            />
                            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 8 }}>
                               <button onClick={handleSend} disabled={sending} style={{ padding: '10px 24px', background: 'var(--color-primary-gradient)', border: 'none', color: '#FFF', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-primary)' }}>
                                   {sending ? <Loader2 size={16} className="spin" /> : <><Send size={16} /> Send Message</>}
                               </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

        </div>
    )
}

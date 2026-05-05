'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
    MessagesSquare, Send, Search, User, 
    MoreVertical, Info, Bell, Phone, Video,
    Loader2, Sparkles, CheckCheck, MessageCircle
} from 'lucide-react'

export default function StudentInbox() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeChat, setActiveChat] = useState<any>(null)
    const [newMessage, setNewMessage] = useState('')
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                // Fetch student messages
                const res = await fetch('/api/dashboard/messages')
                const data = await res.json()
                // Normalise: API may return [] or { messages: [] } or an error object
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.messages)
                    ? data.messages
                    : []
                setMessages(list)
                if (list.length > 0) setActiveChat(list[0])
            } catch {
                // silently fall back to empty list
            } finally {
                setLoading(false)
            }
        }
        fetchMessages()
    }, [])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeChat])

    const handleSend = () => {
        if (!newMessage.trim()) return
        const msg = {
            id: Date.now(),
            sender_id: 'me',
            content: newMessage,
            timestamp: new Date().toISOString(),
            status: 'sent'
        }
        setActiveChat({ ...activeChat, history: [...(activeChat.history || []), msg] })
        setNewMessage('')
    }

    if (loading) return <div style={{ padding: 100, textAlign: 'center' }}><Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} /></div>

    return (
        <div style={{ display: 'flex', height: '100%', background: '#F8FAFC', overflow: 'hidden' }}>
            
            {/* CHAT SIDEBAR */}
            <div style={{ width: 380, background: '#FFF', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ padding: '32px 24px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: 100, fontSize: 11, fontWeight: 1000, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <MessageCircle size={14} fill="var(--color-primary)" stroke="none" /> Official Communications
                        </div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Messages & Notices</h1>
                    </div>    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={20} color="var(--color-primary)" />
                        </div>
                    </div>
                      <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                        <input 
                            type="text" 
                            placeholder="Search messages..." 
                            style={{ padding: '12px 16px 12px 48px', width: '100%', borderRadius: 16, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }} 
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                    {messages.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94A3B8' }}>
                            <MessagesSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                            <div style={{ fontSize: 14, fontWeight: 700 }}>No messages yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Your faculty communications will appear here.</div>
                        </div>
                    ) : messages.map(chat => (
                        <button 
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                             style={{ 
                                width: '100%', display: 'flex', gap: 16, padding: 16, borderRadius: 16, border: 'none', cursor: 'pointer',
                                background: activeChat?.id === chat.id ? 'var(--color-primary-bg)' : 'transparent',
                                transition: 'all 0.1s', marginBottom: 4, textAlign: 'left'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                 <div style={{ width: 52, height: 52, background: chat.id % 2 === 0 ? 'var(--color-primary-gradient)' : '#10B981', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 900, boxShadow: chat.id % 2 === 0 ? 'var(--shadow-primary)' : '0 4px 10px rgba(16,185,129,0.2)' }}>
                                    {chat.name?.charAt(0) || 'F'}
                                </div>
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: '#10B981', border: '3px solid #FFF', borderRadius: '50%' }} />
                            </div>
                             <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Prof. {chat.name}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>2m ago</div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Assessment guidelines details attached.
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* WINDOW HEADER */}
                             <div style={{ height: 100, background: '#FFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 44, height: 44, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={22} color="#64748B" />
                        </div>
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>Prof. {activeChat?.name}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                                Online
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', cursor: 'pointer' }}><Phone size={18} /></button>
                        <button style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', cursor: 'pointer' }}><Video size={18} /></button>
                        <button style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', cursor: 'pointer' }}><MoreVertical size={18} /></button>
                    </div>
                </div>

                {/* MESSAGES FEED */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, background: '#F8FAFC' }}>
                     <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <div style={{ display: 'inline-block', padding: '6px 16px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 20, fontSize: 11, fontWeight: 900, color: '#94A3B8' }}>COMMUNICATION ESTABLISHED • APR 1, 2026</div>
                    </div>

                    {/* MOCK HISTORY */}
                    {[
                        { sender: 'faculty', text: 'Good morning. I’ve uploaded the study guidelines for the upcoming Advanced Logic assessment.', time: '09:42 AM' },
                        { sender: 'student', text: 'Sir, regarding tomorrow’s physics mock exam, will optical physics be included?', time: '09:45 AM', isLast: false },
                        { sender: 'faculty', text: 'Yes, check the "Important Tests" folder in the Study Vault. I’ve detailed the syllabus distribution there.', time: '09:48 AM', isLast: true }
                    ].map((msg, i) => (
                        <div key={i} style={{ 
                            maxWidth: '70%', 
                            alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                            display: 'flex', flexDirection: 'column', gap: 8
                        }}>
                            <div style={{ 
                                padding: '16px 24px', 
                                borderRadius: msg.sender === 'me' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                                 background: msg.sender === 'me' ? 'var(--color-primary-gradient)' : '#FFF',
                                color: msg.sender === 'me' ? '#FFF' : '#0F172A',
                                fontSize: 15, fontWeight: 600, lineHeight: 1.6,
                                boxShadow: msg.sender === 'me' ? 'var(--shadow-primary)' : '0 1x 2px rgba(0,0,0,0.02)',
                                border: msg.sender === 'me' ? 'none' : '1px solid #E2E8F0'
                            }}>
                                {msg.text}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: '#94A3B8', alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start' }}>
                                {msg.time} {msg.sender === 'me' && <CheckCheck size={14} color="#10B981" />}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* INPUT AREA */}
                <div style={{ height: 120, background: '#FFF', borderTop: '1px solid #E2E8F0', padding: '0 40px', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                          <input 
                            type="text" 
                            placeholder="Type your message..." 
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            style={{ width: '100%', height: 60, padding: '0 24px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, fontSize: 15, fontWeight: 600, color: '#0F172A' }}
                        />
                        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 8 }}>
                           <button onClick={handleSend} style={{ padding: '10px 24px', background: 'var(--color-primary-gradient)', border: 'none', color: '#FFF', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-primary)' }}>
                               <Send size={16} /> Send Message
                           </button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}

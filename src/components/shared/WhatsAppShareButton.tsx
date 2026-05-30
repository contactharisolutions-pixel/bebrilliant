'use client'
import { useState, useCallback } from 'react'
import {
    MessageCircle, Link2, X, Loader2, CheckCircle2,
    Copy, QrCode, Share2, ExternalLink
} from 'lucide-react'
export type ShareMode =
    | 'teacher_exam_share'
    | 'student_exam_share'
    | 'teacher_invite'
    | 'institute_exam_promo'
interface WhatsAppShareButtonProps {
    examId?:        string
    examName?:      string
    examFee?:       number
    affiliateId?:   string
    affiliateType?: 'teacher' | 'student'
    mode?:          ShareMode
    /** Text shown on the trigger button */
    label?:         string
    /** Compact icon-only mode */
    compact?:       boolean
}
export function WhatsAppShareButton({
    examId,
    examName   = 'Online Exam',
    examFee    = 0,
    affiliateId,
    affiliateType = 'teacher',
    mode,
    label      = 'Share via WhatsApp',
    compact    = false,
}: WhatsAppShareButtonProps) {
    const [open,        setOpen]        = useState(false)
    const [loading,     setLoading]     = useState(false)
    const [shareData,   setShareData]   = useState<{
        message: string
        whatsapp_url: string
        referral_url: string
        ref_code: string
    } | null>(null)
    const [copied,      setCopied]      = useState(false)
    const [showQR,      setShowQR]      = useState(false)
    const [error,       setError]       = useState('')
    const resolvedMode = mode ?? (affiliateType === 'teacher' ? 'teacher_exam_share' : 'student_exam_share')
    const handleOpen = useCallback(async () => {
        setOpen(true)
        if (shareData) return // already loaded
        setLoading(true)
        setError('')
        try {
            // 1. Generate (or reuse) ref_code
            const genRes = await fetch('/api/affiliate/referral/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    exam_id: examId, 
                    type: affiliateType,
                    affiliate_id: affiliateId 
                }),
            })
            const genData = await genRes.json()
            if (!genRes.ok) throw new Error(genData.error || 'Failed to generate referral')
            // 2. Build WhatsApp message
            const params = new URLSearchParams({
                ref_code:  genData.ref_code,
                exam_name: examName,
                exam_fee:  String(examFee),
                mode:      resolvedMode,
            })
            const msgRes  = await fetch(`/api/affiliate/whatsapp/message?${params}`)
            const msgData = await msgRes.json()
            if (!msgRes.ok) throw new Error(msgData.error || 'Failed to build message')
            setShareData({ ...msgData, ref_code: genData.ref_code })
        } catch (e: any) {
            setError(e.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [examId, examName, examFee, affiliateType, affiliateId, resolvedMode, shareData])
    const handleWhatsApp = () => {
        if (shareData?.whatsapp_url) {
            window.open(shareData.whatsapp_url, '_blank', 'noopener,noreferrer')
        }
    }
    const handleCopy = async () => {
        if (shareData?.referral_url) {
            await navigator.clipboard.writeText(shareData.referral_url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }
    return (
        <>
            {/* TRIGGER BUTTON */}
            <button
                onClick={handleOpen}
                style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            compact ? 0 : 8,
                    padding:        compact ? '8px' : '10px 18px',
                    background:     '#25D366',
                    color:          '#FFF',
                    border:         'none',
                    borderRadius:   compact ? 10 : 12,
                    fontSize:       13,
                    fontWeight:     800,
                    cursor:         'pointer',
                    boxShadow:      '0 4px 14px rgba(37,211,102,0.35)',
                    transition:     'all 0.2s',
                    whiteSpace:     'nowrap',
                }}
            >
                <MessageCircle size={compact ? 18 : 16} fill="#FFF" />
                {!compact && label}
            </button>
            {/* MODAL */}
            {open && (
                <div
                    style={{
                        position:       'fixed',
                        inset:          0,
                        background:     'rgba(5,10,20,0.65)',
                        backdropFilter: 'blur(12px)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        zIndex:         9999,
                        padding:        20,
                    }}
                    onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
                >
                    <div style={{
                        background:    '#FFF',
                        borderRadius:  28,
                        width:         '100%',
                        maxWidth:      520,
                        boxShadow:     '0 40px 100px rgba(0,0,0,0.4)',
                        overflow:      'hidden',
                    }}>
                        {/* MODAL HEADER */}
                        <div style={{
                            padding:        '24px 32px',
                            background:     'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageCircle size={26} color="#FFF" fill="#FFF" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>Share via WhatsApp</div>
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                                        {examName}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={18} color="#FFF" />
                            </button>
                        </div>
                        {/* MODAL BODY */}
                        <div style={{ padding: '28px 32px' }}>
                            {loading && (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <Loader2 size={36} color="#25D366" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                                    <div style={{ fontSize: 14, color: '#64748B', fontWeight: 700 }}>Preparing your referral link...</div>
                                </div>
                            )}
                            {error && (
                                <div style={{ padding: '16px 20px', background: '#FEF2F2', borderRadius: 14, color: '#991B1B', fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                                    ⚠️ {error}
                                </div>
                            )}
                            {!loading && shareData && (
                                <>
                                    {/* MESSAGE PREVIEW */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                            Message Preview
                                        </div>
                                        <div style={{
                                            background:   '#F0FDF4',
                                            border:       '1px solid #BBF7D0',
                                            borderRadius: 16,
                                            padding:      '16px 20px',
                                            fontSize:     13,
                                            color:        '#166534',
                                            fontWeight:   600,
                                            lineHeight:   1.7,
                                            whiteSpace:   'pre-wrap',
                                            wordBreak:    'break-word',
                                            maxHeight:    180,
                                            overflowY:    'auto',
                                        }}>
                                            {shareData.message}
                                        </div>
                                    </div>
                                    {/* REFERRAL LINK */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                            Your Referral Link
                                        </div>
                                        <div style={{
                                            display:      'flex',
                                            alignItems:   'center',
                                            gap:          10,
                                            padding:      '12px 16px',
                                            background:   '#F8FAFC',
                                            border:       '1px solid #E2E8F0',
                                            borderRadius: 12,
                                        }}>
                                            <Link2 size={16} color="#64748B" style={{ flexShrink: 0 }} />
                                            <span style={{ fontSize: 13, color: '#0EA5E9', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {shareData.referral_url}
                                            </span>
                                            <div style={{ padding: '4px 10px', background: '#E0F2FE', borderRadius: 8, fontSize: 11, fontWeight: 900, color: '#0369A1' }}>
                                                REF: {shareData.ref_code}
                                            </div>
                                        </div>
                                    </div>
                                    {/* ACTION BUTTONS */}
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {/* WHATSAPP */}
                                        <button
                                            onClick={handleWhatsApp}
                                            style={{
                                                flex:         2,
                                                padding:      '14px',
                                                background:   '#25D366',
                                                color:        '#FFF',
                                                border:       'none',
                                                borderRadius: 14,
                                                fontSize:     14,
                                                fontWeight:   900,
                                                cursor:       'pointer',
                                                display:      'flex',
                                                alignItems:   'center',
                                                justifyContent: 'center',
                                                gap:          10,
                                                boxShadow:    '0 8px 20px rgba(37,211,102,0.3)',
                                            }}
                                        >
                                            <MessageCircle size={18} fill="#FFF" />
                                            Open WhatsApp
                                            <ExternalLink size={14} />
                                        </button>
                                        {/* COPY */}
                                        <button
                                            onClick={handleCopy}
                                            style={{
                                                flex:         1,
                                                padding:      '14px',
                                                background:   copied ? '#ECFDF5' : '#F8FAFC',
                                                color:        copied ? '#059669' : '#0F172A',
                                                border:       `1px solid ${copied ? '#A7F3D0' : '#E2E8F0'}`,
                                                borderRadius: 14,
                                                fontSize:     13,
                                                fontWeight:   800,
                                                cursor:       'pointer',
                                                display:      'flex',
                                                alignItems:   'center',
                                                justifyContent: 'center',
                                                gap:          8,
                                                transition:   'all 0.2s',
                                            }}
                                        >
                                            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* FOOTER NOTE */}
                        {!loading && (
                            <div style={{ padding: '16px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                                🔒 Referral tracked automatically. Rewards credited after payment confirmation.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

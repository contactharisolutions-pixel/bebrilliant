'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
    User, Mail, Phone, MapPin,
    Shield, Camera, 
    Loader2, Save, Link2, CheckCircle2,
    AlertCircle, X, Search, UserCheck
} from 'lucide-react'

export default function StudentProfile() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null)

    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [guardianName, setGuardianName] = useState('')
    const [emergencyContact, setEmergencyContact] = useState('')
    const [parentEmail, setParentEmail] = useState('')
    const [parentLookupStatus, setParentLookupStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle')
    const [parentPreview, setParentPreview] = useState<{ name: string; email: string } | null>(null)
    const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/student/profile')
                const data = await res.json()
                setProfile(data)
                setFirstName(data.first_name || '')
                setLastName(data.last_name || '')
                setPhone(data.phone || '')
                setGuardianName(data.metadata?.guardian_name || '')
                setEmergencyContact(data.metadata?.emergency_contact || '')
                if (data.parent) {
                    setParentPreview(data.parent)
                    setParentEmail(data.parent.email || '')
                    setParentLookupStatus('found')
                }
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    // Debounced parent email lookup
    const handleParentEmailChange = (email: string) => {
        setParentEmail(email)
        setParentLookupStatus('idle')
        setParentPreview(null)
        if (lookupTimer.current) clearTimeout(lookupTimer.current)
        if (!email.trim() || !email.includes('@')) return

        lookupTimer.current = setTimeout(async () => {
            setParentLookupStatus('searching')
            try {
                const res = await fetch(`/api/student/profile/lookup-parent?email=${encodeURIComponent(email.trim())}`)
                const data = await res.json()
                if (data.id) {
                    setParentPreview({ name: data.full_name, email: data.email })
                    setParentLookupStatus('found')
                } else {
                    setParentLookupStatus('not_found')
                }
            } catch {
                setParentLookupStatus('not_found')
            }
        }, 700)
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveMsg(null)
        try {
            const res = await fetch('/api/student/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    guardian_name: guardianName,
                    emergency_contact: emergencyContact,
                    parent_email: parentEmail,
                })
            })
            const result = await res.json()
            if (result.success) {
                if (result.warning) {
                    setSaveMsg({ type: 'warning', text: result.warning })
                } else {
                    setSaveMsg({ type: 'success', text: result.parent_linked ? 'Profile saved and parent account linked successfully!' : 'Profile updated successfully.' })
                }
            } else {
                setSaveMsg({ type: 'error', text: result.error || 'Failed to save profile.' })
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ padding: 100, textAlign: 'center' }}><Loader2 size={36} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} /></div>

    return (
        <div style={{ padding: '40px 60px', background: '#F8FAFC', minHeight: '100vh' }}>

            {/* PAGE HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
                <div>
                   <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.04em' }}>My Profile Details</h1>
                   <p style={{ margin: '8px 0 0', fontSize: 16, color: '#64748B', fontWeight: 600 }}>Manage your academic identity and personal information.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '14px 28px', background: 'var(--color-primary-gradient)', color: '#FFF', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--shadow-primary)', opacity: saving ? 0.7 : 1 }}
                >
                    {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Update Profile'}
                </button>
            </div>

            {/* SAVE MESSAGE BANNER */}
            {saveMsg && (
                <div style={{
                    marginBottom: 32, padding: '16px 24px', borderRadius: 16,
                    background: saveMsg.type === 'success' ? '#ECFDF5' : saveMsg.type === 'warning' ? '#FFFBEB' : '#FEF2F2',
                    border: `1px solid ${saveMsg.type === 'success' ? '#A7F3D0' : saveMsg.type === 'warning' ? '#FDE68A' : '#FECACA'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                    color: saveMsg.type === 'success' ? '#065F46' : saveMsg.type === 'warning' ? '#92400E' : '#991B1B',
                    fontSize: 14, fontWeight: 700
                }}>
                    {saveMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {saveMsg.text}
                    <button onClick={() => setSaveMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={16} /></button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: 48 }}>
                
                {/* LEFT: AVATAR & STATS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    
                    {/* AVATAR CARD */}
                    <div style={{ background: '#FFF', borderRadius: 32, padding: 48, textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
                        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 32px' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: 40, background: 'var(--color-primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 44, fontWeight: 900, boxShadow: 'var(--shadow-primary)', transform: 'rotate(2deg)' }}>
                                {firstName?.charAt(0) || profile?.full_name?.charAt(0) || 'S'}
                            </div>
                            <button style={{ position: 'absolute', bottom: -8, right: -8, width: 44, height: 44, borderRadius: 14, background: '#0F172A', border: '4px solid #FFF', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <Camera size={18} />
                            </button>
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0 }}>{firstName} {lastName}</h2>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>STUDENT</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
                            <div style={{ padding: '8px 16px', background: '#F8FAFC', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#64748B' }}>BATCH {profile?.metadata?.batch || '2026'}</div>
                            <div style={{ padding: '8px 16px', background: '#F8FAFC', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#64748B' }}>STD {profile?.metadata?.school_class || 'X'}-{profile?.metadata?.division || 'A'}</div>
                        </div>

                        {/* PARENT LINK STATUS BADGE */}
                        <div style={{
                            marginTop: 24, padding: '12px 16px', borderRadius: 14,
                            background: parentLookupStatus === 'found' ? '#ECFDF5' : '#F8FAFC',
                            border: `1px solid ${parentLookupStatus === 'found' ? '#A7F3D0' : '#E2E8F0'}`,
                            display: 'flex', alignItems: 'center', gap: 10
                        }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: parentLookupStatus === 'found' ? '#10B981' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck size={16} color="#FFF" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Parent Link</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: parentLookupStatus === 'found' ? '#065F46' : '#64748B' }}>
                                    {parentLookupStatus === 'found' && parentPreview ? parentPreview.name || 'Linked' : 'Not Linked'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACCOUNT SECURITY STATUS */}
                    <div style={{ background: '#0F172A', borderRadius: 32, padding: 32, color: '#FFF' }}>
                        <h4 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12 }}>
                           <Shield size={20} color="#672AEA" /> Account Security
                        </h4>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                                <span>TWO-FACTOR AUTHENTICATION</span>
                                <span style={{ color: '#10B981' }}>ENABLED</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                                <span>LAST LOGIN IP</span>
                                <span style={{ color: '#FFF' }}>192.168.1.1</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                                <span>PASSWORD CHANGED</span>
                                <span style={{ color: '#F59E0B' }}>12 DAYS AGO</span>
                            </div>
                        </div>
                        <button style={{ width: '100%', marginTop: 32, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', borderRadius: 12, color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                           UPDATE PASSWORD
                        </button>
                    </div>
                </div>

                {/* RIGHT: DETAILED FORM */}
                <div style={{ background: '#FFF', borderRadius: 32, padding: 48, border: '1px solid #E2E8F0', boxShadow: '0 8px 32px rgba(0,0,0,0.01)' }}>
                    
                    {/* ACADEMIC INFO */}
                    <div style={{ marginBottom: 48 }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 900, color: '#111827' }}>Academic Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                            {[
                                { label: 'First Name', val: firstName, setter: setFirstName, icon: User },
                                { label: 'Last Name', val: lastName, setter: setLastName, icon: User },
                                { label: 'Email Address', val: profile?.email, setter: null, icon: Mail },
                                { label: 'Phone Number', val: phone, setter: setPhone, icon: Phone },
                                { label: 'Standard/Grade', val: profile?.metadata?.school_class ? `Standard ${profile.metadata.school_class}` : '', setter: null, icon: MapPin, placeholder: 'UNASSIGNED GRADE' },
                            ].map((f, i) => (
                                <div key={i}>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{f.label}</label>
                                    <div style={{ position: 'relative' }}>
                                        <f.icon style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} size={16} />
                                        <input 
                                            type="text"
                                            value={f.val || ''}
                                            placeholder={f.placeholder || ''}
                                            readOnly={!f.setter}
                                            onChange={f.setter ? (e) => f.setter!(e.target.value) : undefined}
                                            style={{ width: '100%', height: 52, padding: '0 16px 0 48px', background: f.setter ? '#F8FAFC' : '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: f.setter ? 'text' : 'default' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PARENT / GUARDIAN DETAILS */}
                    <div style={{ marginBottom: 48, padding: 32, background: '#F8FAFC', borderRadius: 24, border: '1px solid #F1F5F9' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#111827' }}>Parent / Guardian Details</h3>
                        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>Link your parent's login account so they can view your progress on the Parent Dashboard.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Full Guardian Name</label>
                                <input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="e.g. Ramesh Patel" style={{ width: '100%', height: 52, padding: '0 16px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0F172A' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Emergency Contact Number</label>
                                <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="e.g. +91 98765 43210" style={{ width: '100%', height: 52, padding: '0 16px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0F172A' }} />
                            </div>
                        </div>

                        {/* PARENT LOGIN ID FIELD */}
                        <div style={{ background: '#FFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Link2 size={18} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>Link Parent Account</div>
                                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Enter your parent's registered email ID to connect their account</div>
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={16} />
                                <input
                                    type="email"
                                    value={parentEmail}
                                    onChange={e => handleParentEmailChange(e.target.value)}
                                    placeholder="Enter parent's email address (e.g. parent@example.com)"
                                    style={{
                                        width: '100%', height: 52, padding: '0 48px 0 48px',
                                        background: '#F8FAFC', border: `2px solid ${
                                            parentLookupStatus === 'found' ? '#10B981' :
                                            parentLookupStatus === 'not_found' ? '#EF4444' : '#E2E8F0'
                                        }`,
                                        borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#0F172A', outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                                <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
                                    {parentLookupStatus === 'searching' && <Loader2 size={18} color="#94A3B8" style={{ animation: 'spin 1s linear infinite' }} />}
                                    {parentLookupStatus === 'found' && <CheckCircle2 size={18} color="#10B981" />}
                                    {parentLookupStatus === 'not_found' && <AlertCircle size={18} color="#EF4444" />}
                                </div>
                            </div>

                            {/* PARENT PREVIEW CARD */}
                            {parentLookupStatus === 'found' && parentPreview && (
                                <div style={{ marginTop: 16, padding: '16px 20px', background: '#ECFDF5', borderRadius: 12, border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 18, fontWeight: 900 }}>
                                        {parentPreview.name?.charAt(0) || 'P'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 15, fontWeight: 900, color: '#065F46' }}>{parentPreview.name}</div>
                                        <div style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{parentPreview.email}</div>
                                    </div>
                                    <div style={{ padding: '6px 14px', background: '#10B981', borderRadius: 8, fontSize: 11, fontWeight: 900, color: '#FFF', textTransform: 'uppercase' }}>
                                        ✓ Verified
                                    </div>
                                </div>
                            )}

                            {parentLookupStatus === 'not_found' && (
                                <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', fontSize: 13, fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={15} />
                                    No parent account found with this email in your institution. Please verify the email is correct.
                                </div>
                            )}

                            {parentEmail === '' && parentLookupStatus === 'idle' && (
                                <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                                    💡 Your parent must first register as a Parent on this platform. Then link their email here to give them access to your progress.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ flex: 1, padding: '16px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#FFF', color: '#0F172A', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ flex: 2, padding: '16px', borderRadius: 14, border: 'none', background: 'var(--color-primary-gradient)', color: '#FFF', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: 'var(--shadow-primary)', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                        >
                            {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </div>

            </div>

        </div>
    )
}

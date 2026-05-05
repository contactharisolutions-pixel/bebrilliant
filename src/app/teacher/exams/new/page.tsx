'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings2, Layers, Shuffle, ArrowRight, ArrowLeft, CheckCircle2, Layout, Clock, AlertCircle } from 'lucide-react'
import { P, GLASS_STYLES } from '@/components/shared/institutional/theme'

export default function CreateExamPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    return (
        <div style={{ minHeight: '100%', background: P.bg, padding: '40px 48px' }}>
            <style>{GLASS_STYLES + `input:focus, textarea:focus, select:focus { outline: none; border-color: ${P.brand} !important; border-width: 2px !important; }`}</style>

            <div style={{ maxWidth: 900, margin: '0 auto' }} className="fade-in">

                {/* Header Phase 4 */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ background: P.brandBg, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, color: P.brand, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faculty Portal</div>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: P.border }} />
                            <div style={{ fontSize: 13, color: P.muted, fontWeight: 600 }}>Assessment Creation</div>
                        </div>
                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 950, color: P.dark, letterSpacing: '-0.04em' }}>Create New Assessment</h1>
                        <p style={{ margin: '8px 0 0', fontSize: 15, color: P.muted, fontWeight: 600 }}>Configure exam logic, time-gate restrictions, and Question Bank mappings.</p>
                    </div>
                    
                    {/* STEPPER VISUAL */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ 
                                width: s === step ? 32 : 12, 
                                height: 12, 
                                borderRadius: 10, 
                                background: step >= s ? P.brand : P.border, 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                            }} />
                        ))}
                    </div>
                </header>

                {/* Form Stepper */}
                <div className="glass-card" style={{ borderRadius: 32, border: `1px solid ${P.border}`, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>

                    {step === 1 && (
                        <div style={{ padding: 48 }} className="fade-in">
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: P.dark, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: P.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Layout size={20} color={P.brand} />
                                </div>
                                Structure & Identification
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Exam Title</label>
                                    <input type="text" placeholder="e.g. JEE Advanced Mock | Sequence Alpha" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Test Format</label>
                                    <textarea rows={3} placeholder="Standard operating procedures for students..." style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark, resize: 'none' }}></textarea>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Synchronization Start</label>
                                        <input type="datetime-local" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Synchronization End</label>
                                        <input type="datetime-local" style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ padding: 48 }} className="fade-in">
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: P.dark, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: P.warningBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Settings2 size={20} color={P.warning} />
                                </div>
                                Tracking & Logic Constraints
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Duration (Minutes)</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="number" defaultValue={180} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark }} />
                                            <Clock size={16} color={P.muted} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Question Shuffling</label>
                                        <select style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${P.border}`, background: P.bg, fontSize: 15, fontWeight: 600, color: P.dark, appearance: 'none' }}>
                                            <option value="none">Linear Execution (Fixed)</option>
                                            <option value="shuffled">Stochastic Shuffling (Internal)</option>
                                            <option value="pool">Dynamic Question Selection</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ background: P.bg, borderRadius: 24, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${P.border}` }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: P.dark }}>Anti-Guesswork Penalty</h4>
                                        <p style={{ margin: '4px 0 0', fontSize: 12, color: P.muted, fontWeight: 600 }}>Enable negative marking for incorrect answers</p>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26, cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: P.brand, transition: '.4s', borderRadius: 34 }}></span>
                                        <span style={{ position: 'absolute', height: 18, width: 18, left: 4, bottom: 4, backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: 'translateX(24px)' }}></span>
                                    </label>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: P.infoBg, padding: '14px 20px', borderRadius: 14, color: P.info, fontSize: 13, fontWeight: 700 }}>
                                    <AlertCircle size={18} />
                                    AI Proctoring is enabled by default for all institutional assessments.
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ padding: 48 }} className="fade-in">
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: P.dark, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: P.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Layers size={20} color={P.success} />
                                </div>
                                Question Mapping
                            </h3>
                            <div style={{ textAlign: 'center', padding: '60px 0', background: P.bg, borderRadius: 24, border: `2px dashed ${P.border}` }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: P.border, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                    <Layers size={32} color={P.muted} />
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 800, color: P.muted, marginBottom: 24 }}>You have 0 questions assigned to this assessment.</p>
                                <button onClick={() => router.push('/teacher/questions')} className="hover-lift" style={{ background: P.brand, color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 14, fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto' }}>
                                    Browse Question Bank <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Footer */}
                    <footer style={{ padding: '24px 48px', background: P.bg, borderTop: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            disabled={step === 1}
                            onClick={() => setStep(s => s - 1)}
                            className="hover-lift"
                            style={{ padding: '12px 24px', borderRadius: 14, fontSize: 14, fontWeight: 850, color: P.text, background: '#fff', border: `1px solid ${P.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, opacity: step === 1 ? 0.5 : 1 }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                className="hover-lift"
                                style={{ padding: '12px 32px', borderRadius: 14, fontSize: 14, fontWeight: 900, color: '#fff', background: P.brand, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 20px ${P.brand}20` }}
                            >
                                Continue to Phase {step + 1} <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => alert('Assessment Created!')}
                                className="hover-lift"
                                style={{ padding: '12px 32px', borderRadius: 14, fontSize: 14, fontWeight: 900, color: '#fff', background: P.success, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 8px 20px ${P.success}20` }}
                            >
                                <CheckCircle2 size={18} /> Publish Assessment
                            </button>
                        )}
                    </footer>
                </div>

            </div>
        </div>
    )
}

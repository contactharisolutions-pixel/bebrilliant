'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Send, CheckCircle } from 'lucide-react'

export default function InquiryPage() {
    const [sent, setSent] = React.useState(false)

    return (
        <PageLayout title="General Inquiry" subtitle="Have a question that's not a demo request? We're listening.">
            {sent ? (
                <div style={{ textAlign: 'center', padding: '100px 32px' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${P.success}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <CheckCircle size={40} color={P.success} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 950, color: P.dark, marginBottom: 16 }}>Inquiry Received</h2>
                    <p style={{ fontSize: 16, color: P.text, maxWidth: 400, margin: '0 auto 40px' }}>
                        Thank you for your interest. We've routed your inquiry to the relevant department.
                    </p>
                    <button onClick={() => setSent(false)} style={{ background: P.brand, color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>Send Another</button>
                </div>
            ) : (
                <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', padding: 56, borderRadius: 32, border: `1px solid ${P.border}` }}>
                    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Your Name</label>
                            <input type="text" required style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Email Address</label>
                            <input type="email" required style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Subject</label>
                            <select required style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB' }}>
                                <option value="sales">Sales & Partnerships</option>
                                <option value="technical">Technical Support</option>
                                <option value="billing">Billing Query</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>How can we help?</label>
                            <textarea rows={5} required style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB', resize: 'none' }} />
                        </div>
                        <button type="submit" style={{ background: P.cta, color: '#fff', border: 'none', padding: '18px', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            Submit Inquiry <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </PageLayout>
    )
}

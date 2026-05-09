'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react'

export default function ContactPage() {
    return (
        <PageLayout 
            title="Get in Touch" 
            subtitle="Have specific requirements or technical questions? Our experts are here to help."
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 80, alignItems: 'start' }}>
                
                {/* CONTACT INFO */}
                <div>
                    <h2 style={{ fontSize: 32, fontWeight: 950, color: P.dark, marginBottom: 24 }}>Reach Us Directly</h2>
                    <p style={{ fontSize: 16, color: P.text, lineHeight: 1.6, fontWeight: 500, marginBottom: 48 }}>
                        Our support and sales teams are available Monday through Saturday, from 9 AM to 7 PM IST.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${P.brand}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Mail size={20} color={P.brand} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>Email Support</h4>
                                <div style={{ fontSize: 18, fontWeight: 800, color: P.dark }}>support@bebrilliant.in</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${P.success}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Phone size={20} color={P.success} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>Call Sales</h4>
                                <div style={{ fontSize: 18, fontWeight: 800, color: P.dark }}>+91 98751 59220</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${P.cta}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MapPin size={20} color={P.cta} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 900, color: P.muted, textTransform: 'uppercase', marginBottom: 4 }}>Office Location</h4>
                                <div style={{ fontSize: 16, fontWeight: 700, color: P.dark, lineHeight: 1.5, maxWidth: 300 }}>
                                    104, D Avenue, <br/>Rustomjee Global City, <br/>Virar (W), Mumbai - 401303
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTACT FORM */}
                <div style={{ background: '#fff', padding: 56, borderRadius: 40, border: `1px solid ${P.border}`, boxShadow: '0 40px 100px rgba(0,0,0,0.05)' }}>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Your Name</label>
                            <input type="text" placeholder="Jane Smith" style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Email Address</label>
                            <input type="email" placeholder="jane@example.com" style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Subject</label>
                            <input type="text" placeholder="How can we help?" style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 800, color: P.dark }}>Message</label>
                            <textarea rows={5} placeholder="Write your message here..." style={{ padding: '14px 20px', borderRadius: 12, border: `1px solid ${P.border}`, fontSize: 15, background: '#F9FAFB', resize: 'none' }} />
                        </div>
                        <button type="submit" style={{ background: P.brand, color: '#fff', border: 'none', padding: '18px', borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            Send Message <Send size={18} />
                        </button>
                    </form>
                </div>

            </div>
        </PageLayout>
    )
}

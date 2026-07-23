'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { User, Mail, Phone, Building, Briefcase, MessageSquare, Send, CheckCircle2, ArrowRight } from 'lucide-react'

export default function RequestDemoPage() {
    const [submitted, setSubmitted] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: '',
        designation: '',
        email: '',
        phone: '',
        organization: '',
        type: 'school',
        message: ''
    })
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    organization: formData.organization,
                    email: formData.email,
                    phone: formData.phone,
                    message: `[Designation: ${formData.designation}] [Type: ${formData.type}] ${formData.message}`
                })
            })
            if (res.ok) {
                setSubmitted(true)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to submit request')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <PageLayout 
                title="Request Received" 
                subtitle="Thank you for your interest. Our consultants will reach out shortly."
                bgImage="/request_demo_hero.png"
            >
                <div className="max-w-[1440px] mx-auto px-6 py-32 text-center">
                    <div className="w-24 h-24 rounded-full bg-[#1FAC63]/10 flex items-center justify-center mx-auto mb-10 text-[#1FAC63]">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-4xl font-[950] text-[#111827] mb-6">You're on the list!</h2>
                    <p className="text-xl text-gray-500 font-semibold max-w-xl mx-auto mb-12 leading-relaxed">
                        We've received your data. A specialized demo account and a platform overview document have been sent to your email.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="bg-[#004B93] text-white py-5 px-12 rounded-2xl text-lg font-black shadow-xl shadow-blue-900/40 hover:scale-105 transition-all cursor-pointer"
                    >
                        Return Home
                    </button>
                </div>
            </PageLayout>
        )
    }

    return (
        <PageLayout 
            title="Book a Live Demo" 
            subtitle="Explore how BeBrilliant can transform your institutional operations with a personalized walkthrough."
            bgImage="/request_demo_hero.png"
        >
            <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-24 font-worksans">
                <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[48px] shadow-2xl shadow-blue-950/5">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        <div className="pub-cards-2">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] flex items-center gap-2 font-manrope">
                                    <User size={14} /> Full Name
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="John Doe" 
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] flex items-center gap-2 font-manrope">
                                    <Briefcase size={14} /> Designation
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Principal" 
                                    value={formData.designation}
                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none"
                                />
                            </div>
                        </div>

                        <div className="pub-cards-2">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] flex items-center gap-2 font-manrope">
                                    <Mail size={14} /> Work Email
                                </label>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="john@institute.com" 
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] flex items-center gap-2 font-manrope">
                                    <Phone size={14} /> Contact Number
                                </label>
                                <input 
                                    type="tel" 
                                    required 
                                    placeholder="+91 99999 00000" 
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] flex items-center gap-2 font-manrope">
                                <Building size={14} /> Organization Name
                            </label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Academy of Excellence" 
                                value={formData.organization}
                                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] font-manrope">What best describes you?</label>
                            <select 
                                required 
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all appearance-none cursor-pointer border-none"
                            >
                                <option value="school">School</option>
                                <option value="institute">Coaching Institute</option>
                                <option value="teacher">Independent Teacher</option>
                                <option value="enterprise">Enterprise Organization</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] flex items-center gap-2 font-manrope">
                                <MessageSquare size={14} /> Brief Introduction
                            </label>
                            <textarea 
                                rows={4} 
                                placeholder="Tell us about your institutional needs..." 
                                value={formData.message}
                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all resize-none border-none"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full bg-gradient-to-br from-[#006d3b] to-[#1FAC63] text-white py-6 rounded-2xl text-lg font-black shadow-xl shadow-green-900/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 font-manrope cursor-pointer border-none disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Schedule Assessment Workshop'} <ArrowRight size={22} />
                        </button>
                        
                        <p className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest font-manrope">
                            Secure submission • No credit card required • Response in 24h
                        </p>
                    </form>
                </div>
            </div>
        </PageLayout>
    )
}

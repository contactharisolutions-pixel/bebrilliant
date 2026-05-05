'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { User, Mail, Phone, Building, Briefcase, MessageSquare, Send, CheckCircle2, ArrowRight } from 'lucide-react'

export default function RequestDemoPage() {
    const [submitted, setSubmitted] = React.useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <PageLayout 
                title="Request Received" 
                subtitle="Thank you for your interest. Our consultants will reach out shortly."
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
                        className="bg-[#004B93] text-white py-5 px-12 rounded-2xl text-lg font-black shadow-xl shadow-blue-900/40 hover:scale-105 transition-all"
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
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[48px] border border-gray-50 shadow-2xl shadow-gray-200/50">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <User size={14} /> Full Name
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="John Doe" 
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Briefcase size={14} /> Designation
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Principal" 
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Mail size={14} /> Work Email
                                </label>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="john@institute.com" 
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[13px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Phone size={14} /> Contact Number
                                </label>
                                <input 
                                    type="tel" 
                                    required 
                                    placeholder="+91 99999 00000" 
                                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Building size={14} /> Organization Name
                            </label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Academy of Excellence" 
                                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black uppercase tracking-widest text-gray-400">What best describes you?</label>
                            <select 
                                required 
                                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all appearance-none cursor-pointer"
                            >
                                <option value="school">School</option>
                                <option value="institute">Coaching Institute</option>
                                <option value="teacher">Independent Teacher</option>
                                <option value="enterprise">Enterprise Organization</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <MessageSquare size={14} /> Brief Introduction
                            </label>
                            <textarea 
                                rows={4} 
                                placeholder="Tell us about your institutional needs..." 
                                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-[#004B93]/5 focus:border-[#004B93] focus:bg-white transition-all resize-none"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-[#1FAC63] text-white py-6 rounded-2xl text-lg font-black shadow-xl shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            Schedule Assessment Workshop <ArrowRight size={22} />
                        </button>
                        
                        <p className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            Secure submission • No credit card required • Response in 24h
                        </p>
                    </form>
                </div>
            </div>
        </PageLayout>
    )
}

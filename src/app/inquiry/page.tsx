'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { Send, CheckCircle } from 'lucide-react'

export default function InquiryPage() {
    const [sent, setSent] = React.useState(false)

    return (
        <PageLayout 
            title="General Inquiry" 
            subtitle="Have a question that's not a demo request? We're listening."
            bgImage="/inquiry_hero.png"
        >
            <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-24 font-worksans">
                {sent ? (
                    <div className="max-w-xl mx-auto text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-[#1FAC63]/10 flex items-center justify-center mx-auto mb-8 text-[#1FAC63]">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-[#191c20] mb-4 font-manrope">Inquiry Received</h2>
                        <p className="text-lg text-gray-500 font-semibold max-w-md mx-auto mb-10 leading-relaxed">
                            Thank you for your interest. We've routed your inquiry to the relevant department.
                        </p>
                        <button 
                            onClick={() => setSent(false)} 
                            className="bg-[#004B93] text-white py-4 px-10 rounded-2xl text-md font-black shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all font-manrope cursor-pointer border-none"
                        >
                            Send Another
                        </button>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[48px] shadow-2xl shadow-blue-950/5">
                        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] font-manrope">Your Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="Jane Smith"
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none" 
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] font-manrope">Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="jane@example.com"
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none" 
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] font-manrope">Subject</label>
                                <select 
                                    required 
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all appearance-none cursor-pointer border-none"
                                >
                                    <option value="sales">Sales & Partnerships</option>
                                    <option value="technical">Technical Support</option>
                                    <option value="billing">Billing Query</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] font-manrope">How can we help?</label>
                                <textarea 
                                    rows={5} 
                                    required 
                                    placeholder="Tell us what you need help with..."
                                    className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all resize-none border-none" 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-gradient-to-br from-[#00356a] to-[#004b93] text-white py-5 rounded-2xl text-lg font-black shadow-lg shadow-blue-900/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 font-manrope cursor-pointer border-none"
                            >
                                Submit Inquiry <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </PageLayout>
    )
}

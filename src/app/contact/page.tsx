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
            bgImage="/contact_hero.png"
        >
            <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-24 pub-contact-grid font-worksans">
                
                {/* CONTACT INFO */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-[#191c20] mb-6 font-manrope" style={{ letterSpacing: '-0.02em' }}>Reach Us Directly</h2>
                    <p className="text-base text-gray-500 font-semibold leading-relaxed mb-12">
                        Our support and sales teams are available Monday through Saturday, from 9 AM to 7 PM IST.
                    </p>

                    <div className="flex flex-col gap-8">
                        <div className="flex gap-6 items-start">
                            <div className="w-11 h-11 rounded-2xl bg-[#00356a]/10 flex items-center justify-center flex-shrink-0">
                                <Mail size={20} className="text-[#00356a]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 font-manrope">Email Support</h4>
                                <div className="text-xl font-black text-[#191c20] font-manrope">support@bebrilliant.in</div>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start">
                            <div className="w-11 h-11 rounded-2xl bg-[#006d3b]/10 flex items-center justify-center flex-shrink-0">
                                <Phone size={20} className="text-[#006d3b]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 font-manrope">Call Sales</h4>
                                <div className="text-xl font-black text-[#191c20] font-manrope">+91 98751 59220</div>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start">
                            <div className="w-11 h-11 rounded-2xl bg-[#183754]/10 flex items-center justify-center flex-shrink-0">
                                <MapPin size={20} className="text-[#183754]" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 font-manrope">Office Location</h4>
                                <div className="text-base font-semibold text-[#191c20] leading-relaxed max-w-[280px]">
                                    104, D Avenue, <br/>Rustomjee Global City, <br/>Virar (W), Mumbai - 401303
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTACT FORM */}
                <div className="bg-white p-10 md:p-16 rounded-[48px] shadow-2xl shadow-blue-950/5">
                    <form className="flex flex-col gap-6">
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
                            <input 
                                type="text" 
                                required
                                placeholder="How can we help?" 
                                className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all border-none" 
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-black uppercase tracking-widest text-[#191c20] font-manrope">Message</label>
                            <textarea 
                                rows={5} 
                                required
                                placeholder="Write your message here..." 
                                className="w-full px-6 py-4 rounded-2xl bg-[#ededf4] text-[15px] font-semibold text-[#191c20] placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00356a] transition-all resize-none border-none" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="w-full bg-gradient-to-br from-[#00356a] to-[#004b93] text-white py-5 rounded-2xl text-lg font-black shadow-lg shadow-blue-900/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 font-manrope cursor-pointer border-none"
                        >
                            Send Message <Send size={18} />
                        </button>
                    </form>
                </div>

            </div>
        </PageLayout>
    )
}

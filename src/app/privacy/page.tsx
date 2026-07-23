'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { ShieldCheck, Lock, Eye, Database, Globe } from 'lucide-react'

export default function PrivacyPage() {
    return (
        <PageLayout 
            title="Privacy Policy" 
            subtitle="Last updated: April 15, 2026"
            bgImage="/policy_hero.png"
        >
            <div className="max-w-[1440px] mx-auto px-6 pt-12 pb-24 font-worksans">
                <div className="max-w-3xl mx-auto">
                    {/* ── POLICY GRID ── */}
                    <div className="space-y-16">
                        <section>
                            <div className="flex items-center gap-4 mb-6 font-manrope">
                                <div className="w-10 h-10 rounded-xl bg-[#00356a]/10 flex items-center justify-center text-[#00356a]">
                                    <Database size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#191c20]">1. Data Collection</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                We only collect information that is absolutely necessary to provide our services. This includes your name, contact details, and institutional information. We do not collect any personal data that isn't required for your exams or platform management.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6 font-manrope">
                                <div className="w-10 h-10 rounded-xl bg-[#006d3b]/10 flex items-center justify-center text-[#006d3b]">
                                    <Eye size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#191c20]">2. Usage of Data</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                Your data is used exclusively to manage your account and provide you with a smooth experience. We never sell your data to any third parties. Your student results and exam papers are kept private and are only accessible by you.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6 font-manrope">
                                <div className="w-10 h-10 rounded-xl bg-[#00356a]/10 flex items-center justify-center text-[#00356a]">
                                    <Lock size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#191c20]">3. Security</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                We use institutional-grade encryption to protect your data. Whether it's stored on our servers or being transmitted to your browser, your information is shielded by multiple layers of security protocols.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6 font-manrope">
                                <div className="w-10 h-10 rounded-xl bg-[#006d3b]/10 flex items-center justify-center text-[#006d3b]">
                                    <Globe size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#191c20]">4. Cookies</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                We use simple cookies to keep you logged in and remember your settings. These are necessary for the platform to function correctly. You can manage cookie settings in your browser at any time.
                            </p>
                        </section>
                    </div>

                    {/* ── TRUST NOTEOUT ── */}
                    <div className="mt-20 p-10 bg-[#f3f3fa] rounded-[40px] flex items-start gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#00356a] flex-shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#191c20] mb-2 font-manrope">Our Commitment</h4>
                            <p className="text-gray-500 font-semibold leading-relaxed">
                                At BeBrilliant, we treat your institution's data with the same respect we would our own. Your trust is our most valuable asset.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

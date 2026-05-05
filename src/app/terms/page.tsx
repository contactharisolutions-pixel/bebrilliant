'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { Scale, FileText, CreditCard, Users, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function TermsPage() {
    return (
        <PageLayout 
            title="Terms & Conditions" 
            subtitle="The simple agreement for using BeBrilliant."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                <div className="max-w-3xl mx-auto">
                    {/* ── TERMS GRID ── */}
                    <div className="space-y-16">
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                                    <Scale size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">1. Acceptance of Terms</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                By using BeBrilliant, you agree to follow these simple rules. These are here to ensure that every teacher and student has a fair and secure experience on our platform.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#1FAC63]/10 flex items-center justify-center text-[#1FAC63]">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">2. How to Use the Platform</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                You are responsible for keeping your login details safe. Please use the platform only for academic purposes and avoid any activities that could harm the experience of other users.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                                    <CreditCard size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">3. Payments & Plans</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                Our plans are billed honestly and upfront. If you ever want to change your plan or stop using the service, you can do so easily through your dashboard without any hidden fees.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#1FAC63]/10 flex items-center justify-center text-[#1FAC63]">
                                    <Users size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">4. Referral Rules</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                When referring others, please be honest about what BeBrilliant does. We encourage growth but want to ensure it happens through genuine recommendations from happy partners.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                                    <AlertTriangle size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">5. Responsibility</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                While we strive for perfection, we are not liable for any issues outside of our control. We promise to work hard every day to provide you with the most reliable infrastructure possible.
                            </p>
                        </section>
                    </div>

                    {/* ── TRUST NOTEOUT ── */}
                    <div className="mt-20 p-10 bg-gray-50 rounded-[40px] border border-gray-100 flex items-start gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#004B93] flex-shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#111827] mb-2">Fair Usage</h4>
                            <p className="text-gray-500 font-semibold leading-relaxed">
                                These terms are designed to protect both your institution and our platform. We believe in clear, honest, and mutually beneficial relationships.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

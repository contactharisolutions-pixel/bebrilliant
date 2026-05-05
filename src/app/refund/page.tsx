'use client'

import React from 'react'
import { PageLayout } from '@/components/public/PageLayout'
import { P } from '@/components/shared/institutional/theme'
import { RotateCcw, Wallet, AlertCircle, Calendar, ShieldCheck } from 'lucide-react'

export default function RefundPage() {
    return (
        <PageLayout 
            title="Refund & Returns" 
            subtitle="Transparent guidelines for your payments and credits."
        >
            <div className="max-w-[1440px] mx-auto px-6 py-24">
                <div className="max-w-3xl mx-auto">
                    {/* ── POLICY GRID ── */}
                    <div className="space-y-16">
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                                    <RotateCcw size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">1. Subscription Refunds</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                Our plans are billed on a monthly or annual basis. Since we set up specialized infrastructure for your school or institute immediately, subscription fees are generally not refundable once the period has started.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#1FAC63]/10 flex items-center justify-center text-[#1FAC63]">
                                    <Wallet size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">2. Wallet Credits</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                Credits you buy for your exam wallet are for use within the platform. These credits cannot be returned for cash, but they stay valid for as long as your account is active.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#004B93]/10 flex items-center justify-center text-[#004B93]">
                                    <AlertCircle size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">3. Failed Transactions</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                If your payment fails but money is deducted from your bank, don’t worry! Our system will catch it, and we will either credit your wallet or refund the money to your bank within 5-7 working days.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#1FAC63]/10 flex items-center justify-center text-[#1FAC63]">
                                    <Calendar size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-[#111827]">4. Cancellations</h2>
                            </div>
                            <p className="text-lg text-gray-500 font-semibold leading-relaxed">
                                You can choose to stop your subscription at any time. Once you cancel, your platform will remain ready for use until the end of your current paid month, after which it will simply stop.
                            </p>
                        </section>
                    </div>

                    {/* ── TRUST NOTEOUT ── */}
                    <div className="mt-20 p-10 bg-gray-50 rounded-[40px] border border-gray-100 flex items-start gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#004B93] flex-shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-[#111827] mb-2">Our Fairness Promise</h4>
                            <p className="text-gray-500 font-semibold leading-relaxed">
                                We believe in honest billing. If you ever have a problem with a payment, reach out to us and we will find a fair solution for you.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}

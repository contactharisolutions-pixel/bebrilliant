'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { GraduationCap, Sparkles, Send, Bell, Globe, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function ComingSoonPage() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    // Countdown timer logic
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    })

    useEffect(() => {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 14) // 14 days from now

        const timer = setInterval(() => {
            const now = new Date().getTime()
            const distance = targetDate.getTime() - now

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            })

            if (distance < 0) {
                clearInterval(timer)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSubmitting(false)
        setIsSubmitted(true)
        setEmail('')
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/coming-soon-bg.png"
                    alt="Indian Education Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/85 to-emerald-900/80 backdrop-blur-[2px]" />
            </div>

            {/* Animated Light Trails */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-500/20 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Content Container */}
            <main className="relative z-10 w-full max-w-5xl px-6 py-12 flex flex-col items-center text-center">
                
                {/* Logo & Brand */}
                <div className="flex items-center gap-3 mb-12 animate-fade-in">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <GraduationCap className="text-indigo-600 w-7 h-7" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">BeBrilliant</span>
                </div>

                {/* Main Heading */}
                <div className="space-y-6 mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-indigo-200 text-sm font-medium animate-bounce-subtle">
                        <Sparkles className="w-4 h-4" />
                        <span>The Future of Indian Education is Coming</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                        Empowering Every <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
                            Educator & Student
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        We're building India's most advanced multi-role platform for institutional excellence. 
                        Smart exams, WhatsApp-powered growth, and real-time analytics — all in one place.
                    </p>
                </div>

                {/* Countdown Timer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 w-full max-w-3xl">
                    {[
                        { label: 'Days', value: timeLeft.days },
                        { label: 'Hours', value: timeLeft.hours },
                        { label: 'Minutes', value: timeLeft.minutes },
                        { label: 'Seconds', value: timeLeft.seconds }
                    ].map((item) => (
                        <div key={item.label} className="group relative">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-colors rounded-2xl" />
                            <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 transition-transform group-hover:-translate-y-1">
                                <div className="text-4xl md:text-5xl font-black text-white mb-1 tabular-nums">
                                    {item.value.toString().padStart(2, '0')}
                                </div>
                                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Waitlist Form */}
                <div className="w-full max-w-md relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    
                    <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-2xl p-2 border border-white/10">
                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email for early access..."
                                    className="flex-1 bg-transparent border-0 focus:ring-0 text-white px-4 py-3 placeholder:text-slate-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Join Waitlist</span>
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="py-3 px-4 flex items-center justify-center gap-3 text-emerald-400 font-bold animate-in fade-in zoom-in duration-500">
                                <CheckCircle2 className="w-6 h-6" />
                                <span>You're on the list! We'll be in touch.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Info/Features */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                    {[
                        { icon: Zap, title: "AI-Powered", desc: "Anti-cheat exam engine and smart analytics." },
                        { icon: Globe, title: "Multi-Role", desc: "Portals for Teachers, Students, Admins & Parents." },
                        { icon: Bell, title: "WhatsApp Integration", desc: "Real-time updates and referral growth engine." }
                    ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center text-center space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <feature.icon className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-white font-bold">{feature.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Footer Link */}
                <div className="mt-20 pt-8 border-t border-white/5 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm font-medium">
                    <p>© 2026 BeBrilliant. Crafted for Excellence in India.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-400 transition-colors">Contact Us</a>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-out forwards;
                }
            `}</style>
        </div>
    )
}

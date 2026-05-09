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
                <div className="flex items-center gap-4 mb-20 animate-fade-in">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <GraduationCap className="text-indigo-600 w-8 h-8" />
                    </div>
                    <span className="text-3xl font-bold text-white tracking-tight">BeBrilliant</span>
                </div>

                {/* Main Heading */}
                <div className="space-y-8 mb-20">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-indigo-100 text-sm font-semibold animate-bounce-subtle">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-300" />
                        <span>The Future of Indian Education is Coming</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-white leading-[1.05] tracking-tighter">
                        Empowering Every <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
                            Educator & Student
                        </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-slate-300/90 max-w-3xl mx-auto leading-relaxed font-medium">
                        We're building India's most advanced multi-role platform for institutional excellence. 
                        Smart exams, WhatsApp-powered growth, and real-time analytics — all in one place.
                    </p>
                </div>

                {/* Countdown Timer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 w-full max-w-4xl">
                    {[
                        { label: 'Days', value: timeLeft.days },
                        { label: 'Hours', value: timeLeft.hours },
                        { label: 'Minutes', value: timeLeft.minutes },
                        { label: 'Seconds', value: timeLeft.seconds }
                    ].map((item) => (
                        <div key={item.label} className="group relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl group-hover:bg-indigo-500/30 transition-colors rounded-3xl" />
                            <div className="relative bg-white/5 border border-white/15 backdrop-blur-2xl rounded-3xl p-8 transition-all duration-500 group-hover:-translate-y-2 group-hover:border-white/30">
                                <div className="text-5xl md:text-6xl font-black text-white mb-2 tabular-nums tracking-tighter">
                                    {item.value.toString().padStart(2, '0')}
                                </div>
                                <div className="text-sm uppercase tracking-[0.2em] text-indigo-200/60 font-black">{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Waitlist Form */}
                <div className="w-full max-w-lg relative group mb-32">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000" />
                    
                    <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-2xl p-2.5 border border-white/10 shadow-2xl">
                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email for early access..."
                                    className="flex-1 bg-white/5 border-0 focus:ring-2 focus:ring-indigo-500/50 text-white px-6 py-4 rounded-xl placeholder:text-slate-500 text-lg transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Join Waitlist</span>
                                            <Send className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="py-5 px-6 flex items-center justify-center gap-4 text-emerald-400 font-bold text-lg animate-in fade-in zoom-in duration-700">
                                <CheckCircle2 className="w-8 h-8" />
                                <span>You're on the list! We'll be in touch.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Info/Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl mb-20">
                    {[
                        { icon: Zap, title: "AI-Powered", desc: "Anti-cheat exam engine and smart analytics." },
                        { icon: Globe, title: "Multi-Role", desc: "Portals for Teachers, Students, Admins & Parents." },
                        { icon: Bell, title: "WhatsApp Integration", desc: "Real-time updates and referral growth engine." }
                    ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center text-center space-y-5 group">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30">
                                <feature.icon className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-white text-xl font-bold tracking-tight">{feature.title}</h3>
                                <p className="text-base text-slate-400/80 leading-relaxed max-w-[280px] mx-auto">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Link */}
                <div className="mt-auto pt-12 border-t border-white/10 w-full flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-sm font-medium tracking-wide">
                    <p>© 2026 BeBrilliant. Crafted for Excellence in India.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px] font-bold">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px] font-bold">Contact Us</a>
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

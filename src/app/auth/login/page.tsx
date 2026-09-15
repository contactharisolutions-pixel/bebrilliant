'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
    ArrowRight,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Globe2,
    ShieldCheck
} from 'lucide-react'

interface Tenant {
    id: string
    name: string
    type: string
    subdomain?: string
}

function LoginFormContent() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Subdomain detection
    const [detectedSubdomain, setDetectedSubdomain] = useState<string | null>(null)
    const [detectedTenant, setDetectedTenant] = useState<Tenant | null>(null)

    useEffect(() => {
        let isMounted = true
        fetch('/api/tenants')
            .then((r) => r.json())
            .then((d) => {
                if (!isMounted) return
                const list: Tenant[] = d.tenants || []

                if (typeof window !== 'undefined') {
                    const host = window.location.hostname
                    const parts = host.split('.')
                    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'bebrilliant') {
                        const sub = parts[0].toLowerCase()
                        setDetectedSubdomain(sub)
                        const matched = list.find(t => (t.subdomain || '').toLowerCase() === sub)
                        if (matched) {
                            setDetectedTenant(matched)
                        }
                    }
                }
            })
            .catch(() => { })

        return () => {
            isMounted = false
        }
    }, [])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = useCallback(
        async (data: LoginSchema) => {
            setIsLoading(true)
            setServerError(null)

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                const json = await res.json()

                if (!res.ok) {
                    setServerError(json.error || 'Invalid email or password. Please verify your credentials.')
                    return
                }

                if (json.requires_password_change) {
                    router.push('/auth/change-password?first=true')
                    return
                }

                if (json.user?.role === 'owner') {
                    router.push('/owner/dashboard')
                } else {
                    router.push('/dashboard')
                }
            } catch {
                setServerError('Connection timeout. Please verify your internet connection and try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [router]
    )

    return (
        <AuthLayout
            title={detectedTenant ? `${detectedTenant.name} Portal Login` : 'Institutional Portal Login'}
            subtitle={
                detectedTenant
                    ? 'Enter your institutional credentials to access your official school console.'
                    : 'Enter your institutional email and password to access your dashboard.'
            }
            tenantName={detectedTenant?.name}
            tenantSubdomain={detectedSubdomain || undefined}
        >
            <div className="space-y-4">
                {/* Detected Subdomain Verification Banner */}
                {detectedTenant && (
                    <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold mb-2">
                        <Globe2 size={15} className="text-emerald-600 shrink-0" />
                        <span>Sovereign Portal: <strong>{detectedTenant.name}</strong></span>
                    </div>
                )}

                {/* Server Error Alert */}
                {serverError && (
                    <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <span className="font-medium">{serverError}</span>
                    </div>
                )}

                {/* Streamlined Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="login-email"
                                type="email"
                                placeholder="name@school.edu.in"
                                autoComplete="email"
                                autoFocus
                                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition ${
                                    errors.email ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                                }`}
                                {...register('email')}
                            />
                        </div>
                        {errors.email && (
                            <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                                {errors.email.message}
                            </span>
                        )}
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Password
                            </label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-[11px] font-bold text-[#004B93] hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••"
                                autoComplete="current-password"
                                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition ${
                                    errors.password ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                                }`}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        {errors.password && (
                            <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                                {errors.password.message}
                            </span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        id="login-submit"
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#004B93] hover:bg-[#003870] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Authenticating...
                            </span>
                        ) : (
                            <>
                                <span>Sign In to Portal</span>
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>

                {/* Institutional Security Notice & Onboarding Contact */}
                <div className="mt-8 pt-5 border-t border-slate-100 space-y-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck size={16} className="text-[#004B93] shrink-0 mt-0.5" />
                            <div className="text-[11px] text-slate-600 leading-relaxed">
                                <strong className="text-slate-800 font-bold block mb-0.5">Authorized Institutional Access Only</strong>
                                Student, teacher, and administrative accounts are provisioned directly by institution administrators. If you do not have login credentials, please contact your school management.
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                        Looking to onboard your school or institute?{' '}
                        <Link href="/request-demo" className="text-[#004B93] hover:underline font-bold">
                            Request Institutional Demo
                        </Link>
                    </p>

                    <p className="text-[11px] text-slate-400">
                        Protected by BeBrilliant Enterprise Shield • DPDP Compliant Data Governance
                    </p>
                </div>
            </div>
        </AuthLayout>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-center py-12 text-xs font-semibold text-slate-500">Loading Secure Portal...</div>}>
            <LoginFormContent />
        </Suspense>
    )
}

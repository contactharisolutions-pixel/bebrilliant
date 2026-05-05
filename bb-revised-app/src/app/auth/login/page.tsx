'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

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
                    setServerError(json.error || 'Login failed')
                    return
                }

                // First-login — must change password
                if (json.requires_password_change) {
                    router.push('/auth/change-password?first=true')
                    return
                }

                // Phase 9 Role-Based Routing
                if (json.user?.role === 'owner') {
                    router.push('/owner/dashboard')
                } else if (json.user?.role === 'tenant_admin') {
                    router.push('/admin/dashboard')
                } else {
                    router.push('/dashboard')
                }
            } catch {
                setServerError('Something went wrong. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [router]
    )

    return (
        <AuthLayout title="Platform Login" subtitle="Enter your credentials to access your dashboard.">
            <div className="fade-in-up fade-in-up-delay-1" style={{ width: '100%' }}>
                {serverError && (
                    <div className="alert alert-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontWeight: 600 }}>{serverError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Email */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input
                                id="login-email"
                                type="email"
                                placeholder="name@institute.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: 12,
                                    border: '1.5px solid #F3F4F6',
                                    fontSize: 15,
                                    color: '#111827',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: '#F9FAFB'
                                }}
                                {...register('email')}
                            />
                        </div>
                        {errors.email && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px 48px',
                                    borderRadius: 12,
                                    border: '1.5px solid #F3F4F6',
                                    fontSize: 15,
                                    color: '#111827',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: '#F9FAFB'
                                }}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
                    </div>

                    {/* Forgot */}
                    <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
                        <Link href="/auth/forgot-password" className="auth-link" style={{ fontSize: '0.85rem' }}>
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #004B93 0%, #1FAC63 100%)',
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 800,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            boxShadow: '0 8px 20px rgba(0, 75, 147, 0.25)',
                            marginTop: 24
                        }}
                        onMouseEnter={e => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 75, 147, 0.35)'
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 75, 147, 0.25)'
                            }
                        }}
                    >
                        {isLoading ? <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>
            </div>

                <div style={{ marginTop: 32, textAlign: 'center' }} className="fade-in-up fade-in-up-delay-3">
                    <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/signup" style={{ color: '#004B93', fontWeight: 800, textDecoration: 'none' }}>Create account</Link>
                    </p>
                </div>
        </AuthLayout>
    )
}

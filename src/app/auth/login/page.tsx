'use client'

import { useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
    ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, Building,
    UserCheck, School, GraduationCap, Users
} from 'lucide-react'

const ROLES = [
    { id: 'school', label: 'School Admin', icon: Building },
    { id: 'teacher', label: 'Teacher', icon: UserCheck },
    { id: 'institute', label: 'Institute', icon: School },
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'parent', label: 'Parent', icon: Users },
]

function LoginFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialRole = searchParams.get('role') || 'school'

    const [selectedRole, setSelectedRole] = useState(initialRole)
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
                    body: JSON.stringify({ ...data, role_hint: selectedRole }),
                })

                const json = await res.json()

                if (!res.ok) {
                    setServerError(json.error || 'Login failed')
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
                setServerError('Something went wrong. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [router, selectedRole]
    )

    return (
        <AuthLayout title="Multi-Role Portal Login" subtitle="Select your role and enter credentials to access your dashboard.">
            <style>{`
                .premium-input {
                    width: 100%;
                    padding: 14px 16px 14px 48px;
                    border-radius: 12px;
                    border: 1.5px solid #E5E7EB;
                    font-size: 15px;
                    color: #111827;
                    outline: none;
                    transition: all 0.2s ease;
                    background: #F9FAFB;
                }
                .premium-input:focus {
                    border-color: #004B93;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(0, 75, 147, 0.12);
                }
                .premium-input-pass {
                    width: 100%;
                    padding: 14px 48px;
                    border-radius: 12px;
                    border: 1.5px solid #E5E7EB;
                    font-size: 15px;
                    color: #111827;
                    outline: none;
                    transition: all 0.2s ease;
                    background: #F9FAFB;
                }
                .premium-input-pass:focus {
                    border-color: #004B93;
                    background: #fff;
                    box-shadow: 0 0 0 4px rgba(0, 75, 147, 0.12);
                }
            `}</style>
            
            <div className="fade-in-up fade-in-up-delay-1" style={{ width: '100%' }}>

                {/* Role Selector Tabs */}
                <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
                        Select Portal Role
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ROLES.map((role) => {
                            const Icon = role.icon
                            const isActive = selectedRole === role.id
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '8px 12px',
                                        borderRadius: 10,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        border: isActive ? '1.5px solid #004B93' : '1px solid #E2E8F0',
                                        background: isActive ? '#EFF6FF' : '#FFFFFF',
                                        color: isActive ? '#004B93' : '#475569',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <Icon size={14} /> {role.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {serverError && (
                    <div className="alert alert-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{serverError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Email */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', zIndex: 5 }} />
                            <input
                                id="login-email"
                                type="email"
                                placeholder="name@domain.com"
                                className="premium-input"
                                {...register('email')}
                            />
                        </div>
                        {errors.email && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', zIndex: 5 }} />
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••"
                                className="premium-input-pass"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', zIndex: 5 }}
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
                    >
                        {isLoading ? <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : (
                            <>Sign In to {ROLES.find(r => r.id === selectedRole)?.label || 'Portal'} <ArrowRight size={18} /></>
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

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading Portal...</div>}>
            <LoginFormContent />
        </Suspense>
    )
}

'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentSignupSchema, type StudentSignupSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'

type SignupTab = 'student' | 'teacher' | 'parent'

const TABS: { id: SignupTab; label: string }[] = [
    { id: 'student', label: '🎓 Student' },
    { id: 'teacher', label: '👨‍🏫 Teacher' },
    { id: 'parent', label: '👪 Parent' },
]

interface Tenant {
    id: string
    name: string
    type: string
}

export default function SignupPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<SignupTab>('student')
    const [serverError, setServerError] = useState<string | null>(null)
    const [serverSuccess, setServerSuccess] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
    } = useForm<StudentSignupSchema>({
        resolver: zodResolver(studentSignupSchema),
    })

    // Fetch tenants for dropdown
    useEffect(() => {
        fetch('/api/tenants')
            .then((r) => r.json())
            .then((d) => setTenants(d.tenants || []))
            .catch(() => { })
    }, [])

    // Reset form when tab changes
    useEffect(() => {
        reset()
        setServerError(null)
        setServerSuccess(null)
        setPassword('')
    }, [activeTab, reset])

    // Password strength
    const getStrength = (pw: string) => {
        let score = 0
        if (pw.length >= 8) score++
        if (/[A-Z]/.test(pw)) score++
        if (/[0-9]/.test(pw)) score++
        if (/[^A-Za-z0-9]/.test(pw)) score++
        return score
    }

    const strength = getStrength(password)
    const strengthLabel = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'
    const strengthClass = strength <= 1 ? 'filled-weak' : strength === 2 ? 'filled-medium' : 'filled-strong'

    const onSubmit = useCallback(
        async (data: StudentSignupSchema & { tenant_id?: string; password?: string }) => {
            setIsLoading(true)
            setServerError(null)
            setServerSuccess(null)

            try {
                let endpoint = '/api/auth/signup/student'
                if (activeTab === 'teacher') endpoint = '/api/auth/signup/teacher'
                if (activeTab === 'parent') endpoint = '/api/auth/signup/parent'

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                const json = await res.json()

                if (!res.ok) {
                    setServerError(json.error || 'Signup failed')
                    return
                }

                setServerSuccess(json.message)
                reset()
                setPassword('')

                // Students are redirected to login after signup
                if (activeTab === 'student') {
                    setTimeout(() => router.push('/auth/login'), 2000)
                }
            } catch {
                setServerError('Something went wrong. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [activeTab, reset, router]
    )

    const needsTenant = activeTab === 'student' || activeTab === 'teacher'
    const needsPassword = activeTab === 'teacher' || activeTab === 'parent'

    return (
        <AuthLayout title="Create your account" subtitle="Join BrightBoard and start your journey">
            {/* Tab Switcher */}
            <div className="tab-switcher fade-in-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(t.id)}
                        type="button"
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="card fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
                {serverError && (
                    <div className="alert alert-error" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {serverError}
                    </div>
                )}

                {serverSuccess && (
                    <div className="alert alert-success" role="status">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {serverSuccess}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Name row */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-first-name">First Name</label>
                            <div className="form-input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    id="signup-first-name"
                                    type="text"
                                    placeholder="First name"
                                    autoComplete="given-name"
                                    className={`form-input${errors.first_name ? ' error' : ''}`}
                                    {...register('first_name')}
                                />
                            </div>
                            {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-last-name">Last Name</label>
                            <input
                                id="signup-last-name"
                                type="text"
                                placeholder="Last name"
                                autoComplete="family-name"
                                className={`form-input${errors.last_name ? ' error' : ''}`}
                                {...register('last_name')}
                            />
                            {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-email">Email Address</label>
                        <div className="form-input-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                            </svg>
                            <input
                                id="signup-email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={`form-input${errors.email ? ' error' : ''}`}
                                {...register('email')}
                            />
                        </div>
                        {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-phone">Phone Number</label>
                        <div className="form-input-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.71 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.71A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <input
                                id="signup-phone"
                                type="tel"
                                placeholder="+91 9876543210"
                                autoComplete="tel"
                                className={`form-input${errors.phone ? ' error' : ''}`}
                                {...register('phone')}
                            />
                        </div>
                        {errors.phone && <span className="form-error">{errors.phone.message}</span>}
                        {activeTab === 'student' && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                📌 Your phone number will be your temporary login password
                            </span>
                        )}
                    </div>

                    {/* Institution (Student / Teacher) */}
                    {needsTenant && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-tenant">Institution</label>
                            <select
                                id="signup-tenant"
                                className="form-select"
                                {...register('tenant_id' as keyof StudentSignupSchema)}
                            >
                                <option value="">Select your institution…</option>
                                {tenants.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.type === 'INSTITUTE' ? 'Institute' : 'Personal Teacher'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Password (Teacher / Parent) */}
                    {needsPassword && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-password">Password</label>
                            <div className="form-input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a strong password"
                                    autoComplete="new-password"
                                    className="form-input"
                                    style={{ paddingRight: '2.75rem' }}
                                    {...register('password' as keyof StudentSignupSchema)}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Password Strength */}
                            {password && (
                                <div>
                                    <div className="password-strength">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`strength-bar${i <= strength ? ' ' + strengthClass : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: strength <= 1 ? 'var(--color-error)' : strength <= 2 ? 'var(--color-warning)' : 'var(--color-success)', marginTop: '0.25rem', display: 'block' }}>
                                        {strengthLabel} password
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'teacher' && (
                        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Your application requires approval from your institution admin before you can log in.
                        </div>
                    )}

                    <button
                        id="signup-submit"
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><div className="spinner" /> Creating Account…</>
                        ) : (
                            activeTab === 'student'
                                ? 'Create Student Account'
                                : activeTab === 'teacher'
                                    ? 'Apply as Teacher'
                                    : 'Create Parent Account'
                        )}
                    </button>
                </form>
            </div>

            <p className="auth-footer fade-in-up fade-in-up-delay-3">
                Already have an account?{' '}
                <Link href="/auth/login" className="auth-link">Sign in</Link>
            </p>
        </AuthLayout>
    )
}

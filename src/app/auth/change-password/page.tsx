'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, type ChangePasswordSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Suspense } from 'react'

function ChangePasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isFirstLogin = searchParams.get('first') === 'true'

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ChangePasswordSchema>({
        resolver: zodResolver(changePasswordSchema),
    })

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
        async (data: ChangePasswordSchema) => {
            setIsLoading(true)
            setServerError(null)

            try {
                const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: data.password }),
                })

                const json = await res.json()

                if (!res.ok) {
                    setServerError(json.error || 'Failed to update password')
                    return
                }

                // Fetch role to route to the correct dashboard
                const meRes = await fetch('/api/auth/me')
                const meData = meRes.ok ? await meRes.json() : null

                if (meData?.role === 'owner') {
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
        [router]
    )

    return (
        <AuthLayout
            title={isFirstLogin ? 'Set your password' : 'Change password'}
            subtitle={
                isFirstLogin
                    ? 'Your account requires a new password before you can continue'
                    : 'Choose a strong, unique password for your account'
            }
        >
            {isFirstLogin && (
                <div className="alert alert-warning fade-in-up" style={{ opacity: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    For security, you must set a new personal password before accessing your dashboard.
                </div>
            )}

            <div className="card fade-in-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
                {serverError && (
                    <div className="alert alert-error" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* New Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="new-password">New Password</label>
                        <div className="form-input-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                                className={`form-input${errors.password ? ' error' : ''}`}
                                style={{ paddingRight: '2.75rem' }}
                                {...register('password')}
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
                        {errors.password && <span className="form-error">{errors.password.message}</span>}

                        {/* Strength meter */}
                        {password && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <div className="password-strength">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`strength-bar${i <= strength ? ' ' + strengthClass : ''}`} />
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: strength <= 1 ? 'var(--color-error)' : strength <= 2 ? 'var(--color-warning)' : 'var(--color-success)',
                                    marginTop: '0.25rem',
                                    display: 'block'
                                }}>
                                    {strengthLabel} password
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                        <div className="form-input-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <input
                                id="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                                className={`form-input${errors.confirm_password ? ' error' : ''}`}
                                style={{ paddingRight: '2.75rem' }}
                                {...register('confirm_password')}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowConfirm((s) => !s)}
                                aria-label="Toggle confirm password visibility"
                            >
                                {showConfirm ? (
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
                        {errors.confirm_password && <span className="form-error">{errors.confirm_password.message}</span>}
                    </div>

                    {/* Requirements */}
                    <div style={{
                        background: 'rgba(103, 42, 234, 0.06)',
                        border: '1px solid rgba(103, 42, 234, 0.15)',
                        borderRadius: '10px',
                        padding: '0.875rem 1rem',
                        marginBottom: '1.25rem',
                        fontSize: '0.82rem',
                        color: 'var(--color-text-secondary)',
                    }}>
                        <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.5rem' }}>Password requirements:</strong>
                        {[
                            { check: password.length >= 8, label: 'At least 8 characters' },
                            { check: /[A-Z]/.test(password), label: 'One uppercase letter' },
                            { check: /[0-9]/.test(password), label: 'One number' },
                        ].map(({ check, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={check ? '#34D399' : '#5C6080'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    {check ? <polyline points="20 6 9 17 4 12" /> : <line x1="18" y1="6" x2="6" y2="18" />}
                                </svg>
                                <span style={{ color: check ? '#34D399' : 'var(--color-text-muted)' }}>{label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        id="change-password-submit"
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><div className="spinner" /> Updating…</>
                        ) : (
                            isFirstLogin ? 'Set Password & Continue' : 'Update Password'
                        )}
                    </button>
                </form>
            </div>
        </AuthLayout>
    )
}

export default function ChangePasswordPage() {
    return (
        <Suspense>
            <ChangePasswordForm />
        </Suspense>
    )
}

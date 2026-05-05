'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function ForgotPasswordPage() {
    const [serverMessage, setServerMessage] = useState<string | null>(null)
    const [serverError, setServerError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordSchema>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = useCallback(async (data: ForgotPasswordSchema) => {
        setIsLoading(true)
        setServerError(null)
        setServerMessage(null)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            const json = await res.json()

            if (!res.ok) {
                setServerError(json.error || 'Something went wrong')
                return
            }

            setServerMessage(json.message)
        } catch {
            setServerError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    return (
        <AuthLayout
            title="Forgot password?"
            subtitle="Enter your email and we'll send a reset link"
        >
            <div className="card fade-in-up" style={{ opacity: 0, animationDelay: '0.05s' }}>
                {serverError && (
                    <div className="alert alert-error" role="alert">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {serverError}
                    </div>
                )}

                {serverMessage ? (
                    <div>
                        <div className="alert alert-success" role="status">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                            </svg>
                            {serverMessage}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                            Check your inbox (and spam folder) for the reset link.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="forgot-email">Email Address</label>
                            <div className="form-input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                                </svg>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className={`form-input${errors.email ? ' error' : ''}`}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <span className="form-error">{errors.email.message}</span>}
                        </div>

                        <button
                            id="forgot-password-submit"
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? <><div className="spinner" /> Sending…</> : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>

            <p className="auth-footer fade-in-up fade-in-up-delay-2">
                Remember your password?{' '}
                <Link href="/auth/login" className="auth-link">Back to login</Link>
            </p>
        </AuthLayout>
    )
}

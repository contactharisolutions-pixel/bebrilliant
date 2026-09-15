'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentSignupSchema, type StudentSignupSchema } from '@/lib/validations/auth'
import { AuthLayout } from '@/components/auth/AuthLayout'
import {
    GraduationCap,
    UserCheck,
    Users,
    School,
    Building2,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles,
    HelpCircle,
    Info,
    Globe2
} from 'lucide-react'

type SignupTab = 'student' | 'teacher' | 'parent' | 'institute'

const TABS: { id: SignupTab; label: string; icon: any }[] = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'teacher', label: 'Teacher', icon: UserCheck },
    { id: 'parent', label: 'Parent', icon: Users },
    { id: 'institute', label: 'School / Institute', icon: School },
]

interface Tenant {
    id: string
    name: string
    type: string
    subdomain?: string
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

    // Subdomain & Institution state
    const [detectedSubdomain, setDetectedSubdomain] = useState<string | null>(null)
    const [detectedTenant, setDetectedTenant] = useState<Tenant | null>(null)
    const [selectedTenantId, setSelectedTenantId] = useState<string>('')
    const [customInstitutionName, setCustomInstitutionName] = useState('')
    const [showCustomInstitution, setShowCustomInstitution] = useState(false)

    // Dedicated Institute Onboarding Form State
    const [instituteForm, setInstituteForm] = useState({
        instituteName: '',
        category: 'K-12 School',
        adminName: '',
        email: '',
        phone: '',
        subdomain: '',
        studentCount: '500-2000'
    })

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<StudentSignupSchema>({
        resolver: zodResolver(studentSignupSchema),
    })

    // Fetch tenants & detect subdomain
    useEffect(() => {
        let isMounted = true
        fetch('/api/tenants')
            .then((r) => r.json())
            .then((d) => {
                if (!isMounted) return
                const list: Tenant[] = d.tenants || []
                setTenants(list)

                // Detect subdomain from browser hostname
                if (typeof window !== 'undefined') {
                    const host = window.location.hostname
                    const parts = host.split('.')
                    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'bebrilliant') {
                        const sub = parts[0].toLowerCase()
                        setDetectedSubdomain(sub)
                        const matched = list.find(t => (t.subdomain || '').toLowerCase() === sub)
                        if (matched) {
                            setDetectedTenant(matched)
                            setSelectedTenantId(matched.id)
                        }
                    }
                }
            })
            .catch(() => { })

        return () => {
            isMounted = false
        }
    }, [])

    // Reset state on tab change
    useEffect(() => {
        reset()
        setServerError(null)
        setServerSuccess(null)
        setPassword('')
        setShowCustomInstitution(false)
        setCustomInstitutionName('')
        if (detectedTenant) {
            setSelectedTenantId(detectedTenant.id)
        } else {
            setSelectedTenantId('')
        }
    }, [activeTab, reset, detectedTenant])

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

    // Form submission for Student, Teacher, Parent
    const onSubmit = useCallback(
        async (formData: StudentSignupSchema) => {
            setIsLoading(true)
            setServerError(null)
            setServerSuccess(null)

            try {
                let endpoint = '/api/auth/signup/student'
                if (activeTab === 'teacher') endpoint = '/api/auth/signup/teacher'
                if (activeTab === 'parent') endpoint = '/api/auth/signup/parent'

                // Resolve tenant ID
                let resolvedTenantId = selectedTenantId
                if (showCustomInstitution || selectedTenantId === 'other') {
                    // Fallback to BeBrilliant Open Learning Campus
                    const openTenant = tenants.find(t => (t.subdomain || '').toLowerCase() === 'open' || t.name.toLowerCase().includes('open'))
                    resolvedTenantId = openTenant ? openTenant.id : (tenants[0]?.id || '')
                }

                if ((activeTab === 'student' || activeTab === 'teacher') && !resolvedTenantId) {
                    setServerError('Please select your institution or choose "My Institution Is Not Listed"')
                    setIsLoading(false)
                    return
                }

                if (activeTab === 'teacher' && password.length < 8) {
                    setServerError('Password must be at least 8 characters')
                    setIsLoading(false)
                    return
                }

                const payload: any = {
                    ...formData,
                    tenant_id: resolvedTenantId,
                    custom_institution: showCustomInstitution ? customInstitutionName : undefined
                }

                if (activeTab === 'teacher' || activeTab === 'parent') {
                    payload.password = password
                }

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })

                const json = await res.json()

                if (!res.ok) {
                    setServerError(json.error || 'Signup failed')
                    return
                }

                setServerSuccess(json.message || 'Account created successfully!')
                reset()
                setPassword('')

                if (activeTab === 'student') {
                    setTimeout(() => router.push('/auth/login?role=student'), 2200)
                } else if (activeTab === 'parent') {
                    setTimeout(() => router.push('/auth/login?role=parent'), 2200)
                }
            } catch {
                setServerError('Network gateway timeout. Please try again.')
            } finally {
                setIsLoading(false)
            }
        },
        [activeTab, selectedTenantId, showCustomInstitution, customInstitutionName, password, tenants, reset, router]
    )

    // Handle dedicated Institute Onboarding submission
    const handleInstituteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setServerError(null)
        setServerSuccess(null)

        if (!instituteForm.instituteName.trim() || !instituteForm.adminName.trim() || !instituteForm.email.trim() || !instituteForm.phone.trim()) {
            setServerError('Please fill in all required institution onboarding fields')
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: instituteForm.adminName,
                    email: instituteForm.email,
                    phone: instituteForm.phone,
                    institution: instituteForm.instituteName,
                    role: 'Principal / Management',
                    notes: `Onboarding Request: Preferred Subdomain: ${instituteForm.subdomain || 'pending'}.bebrilliant.in, Category: ${instituteForm.category}, Student Volume: ${instituteForm.studentCount}`
                })
            })

            const json = await res.json()
            if (!res.ok) {
                setServerError(json.error || 'Failed to submit onboarding request')
                return
            }

            setServerSuccess('Institutional Onboarding Application Received! Our sovereign cloud team will provision your dedicated tenant and send confirmation credentials within 2 hours.')
            setInstituteForm({
                instituteName: '',
                category: 'K-12 School',
                adminName: '',
                email: '',
                phone: '',
                subdomain: '',
                studentCount: '500-2000'
            })
        } catch {
            setServerError('Connection error. Please retry or contact support@bebrilliant.in')
        } finally {
            setIsLoading(false)
        }
    }

    const needsTenant = activeTab === 'student' || activeTab === 'teacher'
    const needsPassword = activeTab === 'teacher' || activeTab === 'parent'

    return (
        <AuthLayout
            title={activeTab === 'institute' ? 'Onboard Your Institution' : 'Create your account'}
            subtitle={
                activeTab === 'institute'
                    ? 'Deploy your sovereign school portal with dedicated subdomains and AI grading'
                    : detectedTenant
                        ? `Registering under ${detectedTenant.name}`
                        : 'Join BeBrilliant institutional ecosystem to start your academic journey'
            }
            tenantName={detectedTenant?.name}
            tenantSubdomain={detectedSubdomain || undefined}
        >
            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
                {TABS.map((t) => {
                    const Icon = t.icon
                    const isActive = activeTab === t.id
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                                isActive
                                    ? 'bg-white text-[#004B93] shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                        >
                            <Icon size={14} className={isActive ? 'text-[#004B93]' : 'text-slate-400'} />
                            <span>{t.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Server Error Notice */}
            {serverError && (
                <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4 animate-in fade-in">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{serverError}</span>
                </div>
            )}

            {/* Server Success Notice */}
            {serverSuccess && (
                <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 mb-4 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{serverSuccess}</span>
                </div>
            )}

            {/* Subdomain Detected Sovereign Badge */}
            {detectedTenant && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold mb-4">
                    <Globe2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Affiliated with <strong>{detectedTenant.name}</strong></span>
                </div>
            )}

            {/* ========================================================= */}
            {/* VIEW A: Institutional Onboarding Form                     */}
            {/* ========================================================= */}
            {activeTab === 'institute' ? (
                <form onSubmit={handleInstituteSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Institution / School Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={instituteForm.instituteName}
                                onChange={e => setInstituteForm({ ...instituteForm, instituteName: e.target.value })}
                                placeholder="e.g. St. Xavier's Senior Secondary School"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Institutional Category
                            </label>
                            <select
                                value={instituteForm.category}
                                onChange={e => setInstituteForm({ ...instituteForm, category: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                            >
                                <option value="K-12 School">K-12 School / Academy</option>
                                <option value="Coaching Institute">Coaching / Test Prep</option>
                                <option value="College / University">College / University</option>
                                <option value="Educational Group">Multi-Branch Trust</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Active Students
                            </label>
                            <select
                                value={instituteForm.studentCount}
                                onChange={e => setInstituteForm({ ...instituteForm, studentCount: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                            >
                                <option value="Under 500">Under 500 Students</option>
                                <option value="500-2000">500 – 2,000 Students</option>
                                <option value="2000-5000">2,000 – 5,000 Students</option>
                                <option value="5000+">5,000+ Enterprise</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Administrator Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={instituteForm.adminName}
                                onChange={e => setInstituteForm({ ...instituteForm, adminName: e.target.value })}
                                placeholder="Principal / Director"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Official Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={instituteForm.phone}
                                onChange={e => setInstituteForm({ ...instituteForm, phone: e.target.value })}
                                placeholder="+91 9876543210"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Work Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={instituteForm.email}
                                onChange={e => setInstituteForm({ ...instituteForm, email: e.target.value })}
                                placeholder="admin@yourschool.edu.in"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Preferred Sovereign Subdomain
                        </label>
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-[#004B93]/20 focus-within:border-[#004B93] transition">
                            <span className="pl-3.5 text-xs text-slate-400 font-mono">https://</span>
                            <input
                                type="text"
                                value={instituteForm.subdomain}
                                onChange={e => setInstituteForm({ ...instituteForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                placeholder="yourschool"
                                className="flex-1 px-2 py-2.5 bg-transparent text-xs font-bold font-mono text-[#004B93] placeholder:text-slate-400 focus:outline-none"
                            />
                            <span className="pr-3.5 text-xs text-slate-500 font-bold font-mono">.bebrilliant.in</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#004B93] hover:bg-[#003870] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Provisioning Request...
                            </span>
                        ) : (
                            <>
                                <span>Deploy Sovereign Institution Portal</span>
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>
            ) : (
                /* ========================================================= */
                /* VIEW B: Student / Teacher / Parent Signup Form            */
                /* ========================================================= */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
                    {/* First & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                First Name
                            </label>
                            <input
                                type="text"
                                placeholder="First name"
                                autoComplete="given-name"
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition ${
                                    errors.first_name ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                                }`}
                                {...register('first_name')}
                            />
                            {errors.first_name && (
                                <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                                    {errors.first_name.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Last Name
                            </label>
                            <input
                                type="text"
                                placeholder="Last name"
                                autoComplete="family-name"
                                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition ${
                                    errors.last_name ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                                }`}
                                {...register('last_name')}
                            />
                            {errors.last_name && (
                                <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                                    {errors.last_name.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
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

                    {/* Phone Number */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="tel"
                                placeholder="+91 9876543210"
                                autoComplete="tel"
                                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition ${
                                    errors.phone ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                                }`}
                                {...register('phone')}
                            />
                        </div>
                        {errors.phone && (
                            <span className="text-[11px] text-red-500 font-semibold mt-1 block">
                                {errors.phone.message}
                            </span>
                        )}
                        {activeTab === 'student' && (
                            <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                <Info size={12} className="text-slate-400" />
                                Your phone number will serve as your initial login password.
                            </p>
                        )}
                    </div>

                    {/* Institution Selector for Students & Teachers */}
                    {needsTenant && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Institution / School
                                </label>
                                {!detectedTenant && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomInstitution(prev => !prev)}
                                        className="text-[11px] font-bold text-[#004B93] hover:underline"
                                    >
                                        {showCustomInstitution ? 'Select from list' : 'Institute not showing?'}
                                    </button>
                                )}
                            </div>

                            {/* If custom institution toggle is ON */}
                            {showCustomInstitution ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={customInstitutionName}
                                            onChange={e => setCustomInstitutionName(e.target.value)}
                                            placeholder="Enter your school or institute name"
                                            className="w-full pl-10 pr-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                                        />
                                    </div>
                                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                                        Your account will be provisioned on the <strong>BeBrilliant Open Learning Campus</strong>. Our operations team will reach out to connect your institutional records once verified.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <select
                                        disabled={Boolean(detectedTenant)}
                                        value={selectedTenantId}
                                        onChange={e => {
                                            if (e.target.value === 'other') {
                                                setShowCustomInstitution(true)
                                            } else {
                                                setSelectedTenantId(e.target.value)
                                            }
                                        }}
                                        className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition ${
                                            detectedTenant ? 'cursor-not-allowed bg-emerald-50/40 text-emerald-900 font-bold' : ''
                                        }`}
                                    >
                                        <option value="">Select your institution...</option>
                                        {tenants.map((t) => {
                                            const typeLabel = t.type === 'SCHOOL' ? 'School' : (t.type === 'INSTITUTE' ? 'Institute' : 'Academy')
                                            return (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} • ({typeLabel})
                                                </option>
                                            )
                                        })}
                                        <option value="other">➕ My Institution Is Not Listed Here</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Password for Teacher & Parent */}
                    {needsPassword && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Create strong password (min 8 chars)"
                                    autoComplete="new-password"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004B93]/20 focus:border-[#004B93] transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>

                            {/* Password strength meter */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                                        {[1, 2, 3, 4].map(idx => (
                                            <div
                                                key={idx}
                                                className={`rounded-full transition-all duration-300 ${
                                                    idx <= strength
                                                        ? strength <= 1
                                                            ? 'bg-red-400'
                                                            : strength <= 2
                                                                ? 'bg-amber-400'
                                                                : 'bg-emerald-500'
                                                        : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500">
                                        {strengthLabel} security rating
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Teacher Application Notice */}
                    {activeTab === 'teacher' && (
                        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed font-medium">
                            <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <span>Faculty registrations undergo institutional admin verification before exam authoring permissions are activated.</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#1FAC63] hover:bg-[#189153] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating Account...
                            </span>
                        ) : (
                            <>
                                <span>
                                    {activeTab === 'student'
                                        ? 'Create Student Account'
                                        : activeTab === 'teacher'
                                            ? 'Apply as Faculty Member'
                                            : 'Create Parent Account'}
                                </span>
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* Bottom Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">
                    Already have an institutional account?{' '}
                    <Link href="/auth/login" className="text-[#004B93] hover:underline font-bold">
                        Sign in
                    </Link>
                </p>
                <p className="text-[11px] text-slate-400">
                    Protected by BeBrilliant Enterprise Shield • DPDP Compliant Data Isolation
                </p>
            </div>
        </AuthLayout>
    )
}

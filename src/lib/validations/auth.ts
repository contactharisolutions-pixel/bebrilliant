import { z } from 'zod'

// ─── Student Signup ──────────────────────────────────────────────────────────
export const studentSignupSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .regex(/^\+?[0-9\s\-()]+$/, 'Enter a valid phone number'),
})

export type StudentSignupSchema = z.infer<typeof studentSignupSchema>

// ─── Teacher Signup ──────────────────────────────────────────────────────────
export const teacherSignupSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .regex(/^\+?[0-9\s\-()]+$/, 'Enter a valid phone number'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must include at least one uppercase letter')
        .regex(/[0-9]/, 'Must include at least one number'),
    tenant_id: z.string().uuid('Invalid tenant ID'),
})

export type TeacherSignupSchema = z.infer<typeof teacherSignupSchema>

// ─── Parent Signup ───────────────────────────────────────────────────────────
export const parentSignupSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .regex(/^\+?[0-9\s\-()]+$/, 'Enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ParentSignupSchema = z.infer<typeof parentSignupSchema>

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

export type LoginSchema = z.infer<typeof loginSchema>

// ─── Change Password ─────────────────────────────────────────────────────────
export const changePasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must include at least one uppercase letter')
            .regex(/[0-9]/, 'Must include at least one number'),
        confirm_password: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords don't match",
        path: ['confirm_password'],
    })

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>

// ─── Forgot Password ─────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
    email: z.string().email('Enter a valid email address'),
})

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

// ─── Tenant Creation (Owner Only) ────────────────────────────────────────────
export const createTenantSchema = z.object({
    name: z.string().min(2, 'Institution name must be at least 2 characters'),
    type: z.enum(['INSTITUTE', 'PERSONAL_TEACHER']),
    email: z.string().email('Enter a valid email address'),
    admin_first_name: z.string().min(1, 'Admin first name is required'),
    admin_last_name: z.string().min(1, 'Admin last name is required'),
    admin_password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must include at least one uppercase letter')
        .regex(/[0-9]/, 'Must include at least one number'),
})

export type CreateTenantSchema = z.infer<typeof createTenantSchema>

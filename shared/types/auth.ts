export type UserRole =
    | 'owner'
    | 'tenant_admin'
    | 'teacher'
    | 'teacher_pending'
    | 'student'
    | 'parent'

export type TenantType = 'INSTITUTE' | 'PERSONAL_TEACHER'

export type SubscriptionStatus = 'inactive' | 'active' | 'cancelled' | 'expired'

export interface Tenant {
    id: string
    name: string
    type: TenantType
    email: string | null
    is_active: boolean
    subscription_status: SubscriptionStatus
    created_at: string
}

export interface UserProfile {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    role: UserRole
    tenant_id: string | null
    is_active: boolean
    is_first_login: boolean
    created_at: string
}

export interface Role {
    id: string
    name: string
    description: string | null
}

export interface UserRoleMapping {
    user_id: string
    role_id: string
    tenant_id: string | null
}

export interface AuthUser {
    id: string
    email: string | null
    profile: UserProfile | null
}

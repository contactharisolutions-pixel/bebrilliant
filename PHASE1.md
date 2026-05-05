# BrightBoard — Phase 1: Auth + User + Tenant Foundation

## 🗂️ Project Structure

```
bb-revised-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts          # POST — email/password login
│   │   │   │   ├── signout/route.ts        # POST — signout
│   │   │   │   ├── change-password/route.ts # POST — update password + clear first_login
│   │   │   │   ├── forgot-password/route.ts # POST — send reset email
│   │   │   │   └── signup/
│   │   │   │       ├── student/route.ts    # POST — student registration
│   │   │   │       ├── teacher/route.ts    # POST — teacher application (pending)
│   │   │   │       └── parent/route.ts     # POST — parent registration
│   │   │   ├── tenants/route.ts            # GET (list) / POST (create, owner-only)
│   │   │   └── admin/teachers/[userId]/route.ts # PATCH — approve teacher
│   │   ├── auth/
│   │   │   ├── login/page.tsx              # Login form
│   │   │   ├── signup/page.tsx             # Multi-role signup (tabs)
│   │   │   ├── forgot-password/page.tsx    # Forgot password
│   │   │   └── change-password/page.tsx    # Change/set password (first-login)
│   │   ├── dashboard/page.tsx              # Placeholder dashboard
│   │   ├── globals.css                     # Design system + all styles
│   │   ├── layout.tsx                      # Root layout (Inter font, metadata)
│   │   └── page.tsx                        # Root redirect → /auth/login
│   ├── components/
│   │   └── auth/
│   │       └── AuthLayout.tsx              # Two-column auth layout component
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser-side client (anon key)
│   │   │   ├── server.ts                   # Server-side client (cookies)
│   │   │   └── admin.ts                    # Admin client (service_role — server only)
│   │   └── validations/
│   │       └── auth.ts                     # Zod schemas for all auth forms
│   ├── middleware.ts                        # Session refresh + route protection
│   └── types/
│       └── auth.ts                         # TypeScript types for DB entities
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql          # Full DB migration (run in Supabase SQL Editor)
├── .env.local                              # Frontend env vars (NEXT_PUBLIC_*)
└── .env                                    # Backend env vars (service_role, DB URL)
```

## 🔑 Environment Variables

### `.env.local` (Frontend)
```
NEXT_PUBLIC_SUPABASE_URL=https://bfzlkdurgggzytegvvrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### `.env` (Backend)
```
SUPABASE_URL=https://bfzlkdurgggzytegvvrw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DATABASE_URL=YOUR_DATABASE_URL
```

## 🗄️ Database Setup

1. Go to your **Supabase project SQL Editor**
2. Paste and run the contents of `supabase/migrations/001_initial_schema.sql`
3. This creates:
   - `tenants` table
   - `user_profiles` table (linked to `auth.users`)
   - `roles` table (RBAC)
   - `user_roles` table (RBAC mapping)
   - RLS policies for all tables
   - Helper functions: `get_my_role()`, `get_my_tenant_id()`

## 🔐 Auth Flows

| Flow | Endpoint | Notes |
|------|----------|-------|
| Student Signup | `POST /api/auth/signup/student` | Phone becomes temporary password, `is_first_login=true` |
| Teacher Signup | `POST /api/auth/signup/teacher` | Role `teacher_pending`, `is_active=false` until approved |
| Parent Signup | `POST /api/auth/signup/parent` | Standard signup with password |
| Login | `POST /api/auth/login` | Returns `requires_password_change` flag |
| Forgot Password | `POST /api/auth/forgot-password` | Never reveals if email exists |
| Change Password | `POST /api/auth/change-password` | Clears `is_first_login` flag |
| Signout | `POST /api/auth/signout` | Clears session cookie |
| Create Tenant | `POST /api/tenants` | Owner-only, creates tenant + admin atomically |
| List Tenants | `GET /api/tenants` | Public, returns active tenants for signup form |
| Approve Teacher | `PATCH /api/admin/teachers/[userId]` | Tenant Admin only, promotes to `teacher` |

## 🛡️ Security Checklist

- ✅ All secrets in environment variables (never exposed to browser)
- ✅ `supabaseAdmin` only importable server-side (no `NEXT_PUBLIC_` prefix)
- ✅ RLS enabled on all tables
- ✅ Tenant isolation enforced at DB level via RLS policies
- ✅ Owner-only routes check role before proceeding
- ✅ Forgot password flow doesn't reveal email existence
- ✅ Inactive accounts denied login immediately after auth
- ✅ Rollback on partial failures (auth user deleted if profile create fails)
- ✅ Security headers (CSP, X-Frame-Options, nosniff, referrer-policy)
- ✅ Input validation via Zod on all forms

## 📋 Testing Checklist

### Functional
- [ ] Student signup → login with phone as password → forced password change
- [ ] Teacher signup → appears as `teacher_pending` in DB → admin approves → login works
- [ ] Parent signup → login
- [ ] Forgot password email received
- [ ] Tenant creation (owner role required)

### Security
- [ ] Cross-tenant data access blocked (RLS)
- [ ] Inactive account (`is_active=false`) cannot log in
- [ ] `service_role` key never returned in API response
- [ ] Admin endpoints return 403 for non-admin users

import { pool } from '../db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

class SupabaseQueryBuilder {
    private table: string
    private selectCols: string = '*'
    private conditions: { col: string; val: any; op: string }[] = []
    private orCondition?: string
    private limitVal?: number
    private rangeVal?: { from: number; to: number }
    private orderByCol?: string
    private orderAsc: boolean = true
    private singleRow: boolean = false
    private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | 'rpc' = 'select'
    private payload?: any
    private upsertOptions?: { onConflict?: string }
    private rpcName?: string
    private rpcArgs?: any

    constructor(table: string) {
        this.table = table
    }

    select(cols: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
        this.selectCols = cols
        return this
    }

    eq(col: string, val: any) {
        this.conditions.push({ col, val, op: '=' })
        return this
    }

    neq(col: string, val: any) {
        this.conditions.push({ col, val, op: '<>' })
        return this
    }

    gte(col: string, val: any) {
        this.conditions.push({ col, val, op: '>=' })
        return this
    }

    lte(col: string, val: any) {
        this.conditions.push({ col, val, op: '<=' })
        return this
    }

    in(col: string, valArray: any[]) {
        this.conditions.push({ col, val: valArray, op: 'IN' })
        return this
    }

    ilike(col: string, pattern: string) {
        this.conditions.push({ col, val: pattern, op: 'ILIKE' })
        return this
    }

    like(col: string, pattern: string) {
        this.conditions.push({ col, val: pattern, op: 'LIKE' })
        return this
    }


    or(conditionStr: string) {
        this.orCondition = conditionStr
        return this
    }

    limit(num: number) {
        this.limitVal = num
        return this
    }

    range(from: number, to: number) {
        this.rangeVal = { from, to }
        return this
    }

    order(col: string, options?: { ascending?: boolean }) {
        this.orderByCol = col
        this.orderAsc = options?.ascending ?? true
        return this
    }

    single() {
        this.singleRow = true
        return this
    }

    maybeSingle() {
        this.singleRow = true
        return this
    }

    is(col: string, val: any) {
        this.conditions.push({ col, val, op: '=' })
        return this
    }

    insert(data: any) {
        this.action = 'insert'
        this.payload = data
        return this
    }

    upsert(data: any, options?: { onConflict?: string }) {
        this.action = 'upsert'
        this.payload = data
        this.upsertOptions = options
        return this
    }

    update(data: any) {
        this.action = 'update'
        this.payload = data
        return this
    }

    delete() {
        this.action = 'delete'
        return this
    }

    rpc(name: string, args?: any) {
        this.action = 'rpc'
        this.rpcName = name
        this.rpcArgs = args
        return this
    }

    // Execute builder
    async then(resolve?: (val: any) => any, reject?: (err: any) => any) {
        try {
            const res = await this.execute()
            if (resolve) return resolve(res)
            return res
        } catch (err) {
            if (reject) return reject(err)
            throw err
        }
    }

    private async ensureLifecycleTables() {
        const sqls = [
            `CREATE TABLE IF NOT EXISTS lead_call_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lead_id UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
                staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
                call_number INTEGER NOT NULL DEFAULT 1,
                call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                duration_mins INTEGER,
                outcome TEXT NOT NULL,
                notes TEXT, customer_requirement TEXT, demo_interest BOOLEAN DEFAULT FALSE,
                preferred_demo_date DATE, preferred_demo_time TEXT, demo_type TEXT,
                next_followup_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS lead_demo_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lead_id UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
                call_log_id UUID, demo_type TEXT NOT NULL DEFAULT 'online',
                preferred_date DATE, preferred_time TEXT, customer_city TEXT,
                customer_state TEXT, customer_pincode TEXT, customer_address TEXT,
                status TEXT NOT NULL DEFAULT 'pending_assignment',
                suggested_staff_id UUID, assigned_staff_id UUID, assignment_score INTEGER,
                assignment_reason TEXT, confirmed_by UUID, confirmed_at TIMESTAMPTZ,
                scheduled_at TIMESTAMPTZ, meeting_link TEXT, sla_deadline TIMESTAMPTZ,
                sla_breached BOOLEAN DEFAULT FALSE, completed_at TIMESTAMPTZ,
                outcome TEXT, interest_level INTEGER, demo_notes TEXT,
                deal_probability INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS platform_tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                task_type TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
                lead_id UUID, demo_request_id UUID, assigned_to UUID, created_by UUID,
                due_at TIMESTAMPTZ, priority TEXT NOT NULL DEFAULT 'medium',
                sla_minutes INTEGER, sla_breached BOOLEAN DEFAULT FALSE,
                status TEXT NOT NULL DEFAULT 'pending', completed_at TIMESTAMPTZ,
                completion_notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS lifecycle_timeline (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lead_id UUID NOT NULL REFERENCES owner_leads(id) ON DELETE CASCADE,
                event_type TEXT NOT NULL, event_label TEXT NOT NULL, description TEXT,
                staff_id UUID, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS onboarding_cases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID, lead_id UUID,
                organization_name TEXT NOT NULL, contact_name TEXT, contact_email TEXT, contact_phone TEXT,
                assigned_staff_id UUID, assigned_at TIMESTAMPTZ,
                stage TEXT NOT NULL DEFAULT 'assigned', stage_progress_pct INTEGER NOT NULL DEFAULT 12,
                target_completion_date DATE, sla_deadline TIMESTAMPTZ, sla_breached BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMPTZ, completed_by UUID, notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS onboarding_checklists (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                case_id UUID REFERENCES onboarding_cases(id) ON DELETE CASCADE,
                stage TEXT NOT NULL, task_name TEXT NOT NULL, is_completed BOOLEAN NOT NULL DEFAULT FALSE,
                completed_at TIMESTAMPTZ, completed_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS training_cases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(), onboarding_case_id UUID, tenant_id UUID, lead_id UUID,
                organization_name TEXT NOT NULL, assigned_trainer_id UUID,
                status TEXT NOT NULL DEFAULT 'pending_trainer', training_type TEXT NOT NULL DEFAULT 'admin',
                scheduled_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, sla_deadline TIMESTAMPTZ,
                feedback_rating INTEGER, feedback_comments TEXT, notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS training_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                case_id UUID REFERENCES training_cases(id) ON DELETE CASCADE,
                session_no INTEGER NOT NULL DEFAULT 1, topic TEXT NOT NULL,
                conducted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), duration_mins INTEGER DEFAULT 60,
                attendees_count INTEGER DEFAULT 1, meeting_link TEXT, notes TEXT,
                conducted_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`
        ]

        for (const sql of sqls) {
            try { await pool.query(sql) } catch (e) { /* ignore if exists */ }
        }
    }

    private async execute() {
        const lifecycleTables = ['lead_call_logs', 'lead_demo_requests', 'platform_tasks', 'lifecycle_timeline', 'onboarding_cases', 'onboarding_checklists', 'training_cases', 'training_sessions']
        if (lifecycleTables.includes(this.table)) {
            await this.ensureLifecycleTables()
        }


        let sql = ''
        const params: any[] = []
        let paramIdx = 1

        const buildWhere = () => {
            const conds = this.conditions.map(c => {
                let columnName = c.col
                if (columnName.includes('->>')) {
                    const parts = columnName.split('->>')
                    columnName = `${parts[0]}->>'${parts[1]}'`
                }

                if (c.val === null) {
                    return `${columnName} IS ${c.op === '=' ? 'NULL' : 'NOT NULL'}`
                }

                if (c.op === 'IN') {
                    if (!Array.isArray(c.val) || c.val.length === 0) {
                        return '1=0'
                    }
                    const placeholders = c.val.map(val => {
                        params.push(val)
                        return `$${paramIdx++}`
                    })
                    return `${columnName} IN (${placeholders.join(', ')})`
                }

                params.push(c.val)
                return `${columnName} ${c.op} $${paramIdx++}`
            })

            if (this.orCondition) {
                const parts = this.orCondition.split(',')
                const parsedParts = parts.map(p => {
                    if (p.includes('.is.null')) {
                        const col = p.split('.')[0]
                        return `${col} IS NULL`
                    }
                    if (p.includes('.eq.')) {
                        const [col, _, val] = p.split('.')
                        if (val === 'null') return `${col} IS NULL`
                        params.push(val)
                        return `${col} = $${paramIdx++}`
                    }
                    return ''
                }).filter(Boolean)
                if (parsedParts.length > 0) {
                    conds.push(`(${parsedParts.join(' OR ')})`)
                }
            }

            if (conds.length === 0) return ''
            return ` WHERE ${conds.join(' AND ')}`
        }


        if (this.action === 'select') {
            let selectStr = this.selectCols.trim()
            let leftJoinStr = ''
            let isOwnerLeadsWithDemos = false
            
            // Check for relationship patterns
            let isTenantRelationship = false
            let isRolePermsWithRelations = false
            let isTenantsWithUserCount = false
            let isExamsWithRelations = false
            let isWalletTxnsWithRelations = false
            let isInvitesWithRelations = false
            let isCreatedByWithRelations = false
            let isAssignedToWithRelations = false
            let isTenantSubWithRelations = false

            if (selectStr.includes('tenants:tenant_id')) {
                selectStr = 'up.*, t.name as tenant_name, t.logo as tenant_logo, t.tenant_type'
                leftJoinStr = ' LEFT JOIN public.tenants t ON up.tenant_id = t.id'
            } else if (this.table === 'owner_leads') {
                if (selectStr.includes('demos')) {
                    isOwnerLeadsWithDemos = true
                    selectStr = selectStr.replace(/,\s*demos\s*\([^)]*\)/gi, '').trim()
                }
            } else {
                const tenantsRegex = /,\s*tenants(?:![^)]*)?\([^)]*\)/gi
                if (tenantsRegex.test(selectStr)) {
                    isTenantRelationship = true
                    selectStr = selectStr.replace(tenantsRegex, '').trim()
                }

                if (this.table === 'role_permissions' && selectStr.includes('roles!')) {
                    isRolePermsWithRelations = true
                    selectStr = selectStr
                        .replace(/,\s*roles![^)]*\)/gi, '')
                        .replace(/,\s*permissions![^)]*\)/gi, '')
                        .trim()
                }

                if (this.table === 'tenants' && selectStr.includes('user_profiles!')) {
                    isTenantsWithUserCount = true
                    selectStr = selectStr.replace(/,\s*user_profiles![^)]*\)/gi, '').trim()
                }

                if (this.table === 'exams' && selectStr.includes('exam_config')) {
                    isExamsWithRelations = true
                    selectStr = selectStr.replace(/,\s*exam_config\s*\([^)]*\)/gi, '').trim()
                }

                if (this.table === 'wallet_transactions' && selectStr.includes('user_profiles!')) {
                    isWalletTxnsWithRelations = true
                    selectStr = selectStr
                        .replace(/,\s*user_profiles![^)]*\)/gi, '')
                        .replace(/,\s*tenants![^)]*\)/gi, '')
                        .trim()
                }

                if (this.table === 'staff_invites' && selectStr.includes('invited_by_profile')) {
                    isInvitesWithRelations = true
                    selectStr = selectStr.replace(/,\s*invited_by_profile:[^)]*\)/gi, '').trim()
                }
                if (['onboarding_comments', 'onboarding_timeline_events', 'lead_activities'].includes(this.table) && selectStr.includes('created_by_profile')) {
                    isCreatedByWithRelations = true
                    selectStr = selectStr.replace(/,\s*created_by_profile:[^)]*\)/gi, '').trim()
                }
                if (this.table === 'lead_reminders' && selectStr.includes('assigned_to_profile')) {
                    isAssignedToWithRelations = true
                    selectStr = selectStr.replace(/,\s*assigned_to_profile:[^)]*\)/gi, '').trim()
                }
                if (this.table === 'tenant_subscriptions' && selectStr.includes('plans')) {
                    isTenantSubWithRelations = true
                    selectStr = selectStr.replace(/,\s*plans\s*\([^)]*\)/gi, '').trim()
                }
            }

            const tableAlias = this.table === 'user_profiles' ? 'up' : this.table
            sql = `SELECT ${selectStr} FROM ${this.table} ${tableAlias}${leftJoinStr}`
            sql += buildWhere()

            if (this.orderByCol) {
                sql += ` ORDER BY ${this.orderByCol} ${this.orderAsc ? 'ASC' : 'DESC'}`
            }

            // Execute the query to get all matching rows
            let { rows } = await pool.query(sql, params)
            const totalCount = rows.length

            // Slice rows in-memory for pagination/limit queries
            if (this.rangeVal) {
                rows = rows.slice(this.rangeVal.from, this.rangeVal.to + 1)
            } else if (this.limitVal !== undefined) {
                rows = rows.slice(0, this.limitVal)
            } else if (this.singleRow) {
                rows = rows.slice(0, 1)
            }
            
            // Nest relationships
            if (this.selectCols.includes('tenants:tenant_id')) {
                rows.forEach((r: any) => {
                    r.tenants = {
                        name: r.tenant_name,
                        logo: r.tenant_logo,
                        tenant_type: r.tenant_type
                    }
                })
            }

            if (isTenantRelationship) {
                const tenantIds = rows.map((r: any) => r.tenant_id).filter(Boolean)
                if (tenantIds.length > 0) {
                    const { rows: tenantRows } = await pool.query(
                        `SELECT id, name, type FROM public.tenants WHERE id = ANY($1)`,
                        [tenantIds]
                    )
                    const tenantMap = Object.fromEntries(tenantRows.map((t: any) => [t.id, t]))
                    rows.forEach((r: any) => {
                        r.tenants = tenantMap[r.tenant_id] || null
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.tenants = null
                    })
                }
            }

            if (isRolePermsWithRelations) {
                const roleIds = rows.map((r: any) => r.role_id).filter(Boolean)
                const permIds = rows.map((r: any) => r.permission_id).filter(Boolean)

                let rolesMap: any = {}
                if (roleIds.length > 0) {
                    const { rows: roleRows } = await pool.query(
                        `SELECT id, name FROM public.roles WHERE id = ANY($1)`,
                        [roleIds]
                    )
                    rolesMap = Object.fromEntries(roleRows.map((r: any) => [r.id, r]))
                }

                let permsMap: any = {}
                if (permIds.length > 0) {
                    const { rows: permRows } = await pool.query(
                        `SELECT id, key, module, action FROM public.permissions WHERE id = ANY($1)`,
                        [permIds]
                    )
                    permsMap = Object.fromEntries(permRows.map((p: any) => [p.id, p]))
                }

                rows.forEach((r: any) => {
                    r.roles = rolesMap[r.role_id] || null
                    r.permissions = permsMap[r.permission_id] || null
                })
            }

            if (isTenantsWithUserCount) {
                const tenantIds = rows.map((r: any) => r.id)
                if (tenantIds.length > 0) {
                    const { rows: countRows } = await pool.query(
                        `SELECT tenant_id, COUNT(*) as count FROM public.user_profiles WHERE tenant_id = ANY($1) GROUP BY tenant_id`,
                        [tenantIds]
                    )
                    const countMap = Object.fromEntries(countRows.map((c: any) => [c.tenant_id, parseInt(c.count)]))
                    rows.forEach((r: any) => {
                        r.user_profiles = [{ count: countMap[r.id] || 0 }]
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.user_profiles = [{ count: 0 }]
                    })
                }
            }

            if (isExamsWithRelations) {
                const examIds = rows.map((r: any) => r.id)
                if (examIds.length > 0) {
                    const { rows: configRows } = await pool.query(
                        `SELECT exam_id, total_questions, total_marks, negative_marking, randomization_mode FROM public.exam_config WHERE exam_id = ANY($1)`,
                        [examIds]
                    )
                    const configMap = Object.fromEntries(configRows.map((c: any) => [c.exam_id, c]))
                    rows.forEach((r: any) => {
                        r.exam_config = configMap[r.id] || null
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.exam_config = null
                    })
                }
            }

            if (isWalletTxnsWithRelations) {
                const studentIds = rows.map((r: any) => r.student_id).filter(Boolean)
                const tenantIds = rows.map((r: any) => r.tenant_id).filter(Boolean)

                let studentMap: any = {}
                if (studentIds.length > 0) {
                    const { rows: studentRows } = await pool.query(
                        `SELECT id, first_name, last_name, email FROM public.user_profiles WHERE id = ANY($1)`,
                        [studentIds]
                    )
                    studentMap = Object.fromEntries(studentRows.map((s: any) => [s.id, s]))
                }

                let tenantMap: any = {}
                if (tenantIds.length > 0) {
                    const { rows: tenantRows } = await pool.query(
                        `SELECT id, name, type FROM public.tenants WHERE id = ANY($1)`,
                        [tenantIds]
                    )
                    tenantMap = Object.fromEntries(tenantRows.map((t: any) => [t.id, t]))
                }

                rows.forEach((r: any) => {
                    r.user_profiles = studentMap[r.student_id] || null
                    r.tenants = tenantMap[r.tenant_id] || null
                })
            }

            if (isInvitesWithRelations) {
                const userIds = rows.map((r: any) => r.invited_by).filter(Boolean)
                if (userIds.length > 0) {
                    const { rows: userRows } = await pool.query(
                        `SELECT id, first_name, last_name, email FROM public.user_profiles WHERE id = ANY($1)`,
                        [userIds]
                    )
                    const userMap = Object.fromEntries(userRows.map((u: any) => [u.id, u]))
                    rows.forEach((r: any) => {
                        r.invited_by_profile = userMap[r.invited_by] || null
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.invited_by_profile = null
                    })
                }
            }

            if (isCreatedByWithRelations) {
                const userIds = rows.map((r: any) => r.created_by).filter(Boolean)
                if (userIds.length > 0) {
                    const { rows: userRows } = await pool.query(
                        `SELECT id, first_name, last_name, email, role, avatar_url FROM public.user_profiles WHERE id = ANY($1)`,
                        [userIds]
                    )
                    const userMap = Object.fromEntries(userRows.map((u: any) => [u.id, u]))
                    rows.forEach((r: any) => {
                        r.created_by_profile = userMap[r.created_by] || null
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.created_by_profile = null
                    })
                }
            }

            if (isAssignedToWithRelations) {
                const userIds = rows.map((r: any) => r.assigned_to).filter(Boolean)
                if (userIds.length > 0) {
                    const { rows: userRows } = await pool.query(
                        `SELECT id, first_name, last_name, email FROM public.user_profiles WHERE id = ANY($1)`,
                        [userIds]
                    )
                    const userMap = Object.fromEntries(userRows.map((u: any) => [u.id, u]))
                    rows.forEach((r: any) => {
                        r.assigned_to_profile = userMap[r.assigned_to] || null
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.assigned_to_profile = null
                    })
                }
            }

            if (isTenantSubWithRelations) {
                const planIds = rows.map((r: any) => r.plan_id).filter(Boolean)
                if (planIds.length > 0) {
                    const { rows: planRows } = await pool.query(
                        `SELECT id, name, price, type, billing_cycle, max_students, max_teachers, features FROM public.plans WHERE id = ANY($1)`,
                        [planIds]
                    )
                    const planMap = Object.fromEntries(planRows.map((p: any) => [p.id, p]))
                    rows.forEach((r: any) => {
                        r.plans = planMap[r.plan_id] || null
                    })
                } else {
                    rows.forEach((r: any) => {
                        r.plans = null
                    })
                }
            }

            if (this.table === 'owner_leads') {
                // 1. Nest demos with conducted_by staff profiles
                if (isOwnerLeadsWithDemos) {
                    const leadIds = rows.map((r: any) => r.id)
                    if (leadIds.length > 0) {
                        const { rows: allDemos } = await pool.query(
                            `SELECT id, lead_id, scheduled_at, status, notes, conducted_by FROM public.demos WHERE lead_id = ANY($1) ORDER BY scheduled_at DESC`,
                            [leadIds]
                        )
                        const staffIds = [...new Set(allDemos.map((d: any) => d.conducted_by).filter(Boolean))]
                        let staffMap: any = {}
                        if (staffIds.length > 0) {
                            const { rows: staffProfiles } = await pool.query(
                                `SELECT id, first_name, last_name, email FROM public.user_profiles WHERE id = ANY($1)`,
                                [staffIds]
                            )
                            staffMap = Object.fromEntries(staffProfiles.map((s: any) => [s.id, s]))
                        }
                        allDemos.forEach((d: any) => {
                            d.conducted_by_profile = staffMap[d.conducted_by] || null
                        })
                        rows.forEach((r: any) => {
                            r.demos = allDemos.filter((d: any) => d.lead_id === r.id)
                        })
                    } else {
                        rows.forEach((r: any) => { r.demos = [] })
                    }
                }

                // 2. Nest assigned_to staff profile
                const assignedIds = [...new Set(rows.map((r: any) => r.assigned_to).filter(Boolean))]
                if (assignedIds.length > 0) {
                    const { rows: staffProfiles } = await pool.query(
                        `SELECT id, first_name, last_name, email, role FROM public.user_profiles WHERE id = ANY($1)`,
                        [assignedIds]
                    )
                    const staffMap = Object.fromEntries(staffProfiles.map((s: any) => [s.id, s]))
                    rows.forEach((r: any) => {
                        r.assigned_to_profile = staffMap[r.assigned_to] || null
                    })
                } else {
                    rows.forEach((r: any) => { r.assigned_to_profile = null })
                }

                // 3. Nest tenant details
                const tenantIds = [...new Set(rows.map((r: any) => r.tenant_id).filter(Boolean))]
                if (tenantIds.length > 0) {
                    const { rows: tenantData } = await pool.query(
                        `SELECT id, name, type, is_active FROM public.tenants WHERE id = ANY($1)`,
                        [tenantIds]
                    )
                    const tenantMap = Object.fromEntries(tenantData.map((t: any) => [t.id, t]))
                    rows.forEach((r: any) => {
                        r.tenant = tenantMap[r.tenant_id] || null
                    })
                } else {
                    rows.forEach((r: any) => { r.tenant = null })
                }
            }

            const data = this.singleRow ? (rows[0] || null) : rows
            return { data, error: null, count: totalCount }
        }

        if (this.action === 'insert') {
            const data = Array.isArray(this.payload) ? this.payload : [this.payload]
            if (data.length === 0) return { data: this.singleRow ? null : [], error: null }

            const cols = Object.keys(data[0])
            const valPlaceholders: string[] = []
            
            data.forEach(row => {
                const placeholders = cols.map(col => {
                    params.push(row[col])
                    return `$${paramIdx++}`
                })
                valPlaceholders.push(`(${placeholders.join(', ')})`)
            })

            sql = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES ${valPlaceholders.join(', ')} RETURNING *`
            const { rows } = await pool.query(sql, params)
            return { data: this.singleRow ? (rows[0] || null) : (Array.isArray(this.payload) ? rows : rows[0]), error: null }
        }

        if (this.action === 'upsert') {
            const data = Array.isArray(this.payload) ? this.payload : [this.payload]
            if (data.length === 0) return { data: this.singleRow ? null : [], error: null }

            const cols = Object.keys(data[0])
            const valPlaceholders: string[] = []
            
            data.forEach(row => {
                const placeholders = cols.map(col => {
                    params.push(row[col])
                    return `$${paramIdx++}`
                })
                valPlaceholders.push(`(${placeholders.join(', ')})`)
            })

            const conflictTarget = this.upsertOptions?.onConflict || 'id'
            const updateCols = cols.filter(c => c !== conflictTarget)
            const updateSet = updateCols.map(col => `${col} = EXCLUDED.${col}`)

            sql = `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES ${valPlaceholders.join(', ')}`
            sql += ` ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateSet.join(', ')}`
            sql += ` RETURNING *`

            const { rows } = await pool.query(sql, params)
            return { data: this.singleRow ? (rows[0] || null) : (Array.isArray(this.payload) ? rows : rows[0]), error: null }
        }

        if (this.action === 'update') {
            const cols = Object.keys(this.payload)
            const setStatements = cols.map(col => {
                params.push(this.payload[col])
                return `${col} = $${paramIdx++}`
            })

            sql = `UPDATE ${this.table} SET ${setStatements.join(', ')}`
            sql += buildWhere()
            sql += ' RETURNING *'

            const { rows } = await pool.query(sql, params)
            return { data: this.singleRow ? (rows[0] || null) : rows, error: null }
        }

        if (this.action === 'delete') {
            sql = `DELETE FROM ${this.table}`
            sql += buildWhere()
            sql += ' RETURNING *'

            const { rows } = await pool.query(sql, params)
            return { data: rows, error: null }
        }

        if (this.action === 'rpc') {
            const argNames = this.rpcArgs ? Object.keys(this.rpcArgs) : []
            const placeholders = argNames.map((name, i) => {
                params.push(this.rpcArgs[name])
                return `${name} => $${i + 1}`
            })
            sql = `SELECT * FROM ${this.rpcName}(${placeholders.join(', ')})`
            const { rows } = await pool.query(sql, params)
            
            let data = rows
            if (rows.length > 0) {
                const cols = Object.keys(rows[0])
                if (cols.length === 1 && (cols[0] === this.rpcName || cols[0].startsWith('get_') || cols[0].startsWith('process_') || cols[0].startsWith('validate_'))) {
                    data = rows.map((r: any) => r[cols[0]]) as any
                    if (this.singleRow || rows.length === 1) {
                        data = rows[0][cols[0]] as any
                    }
                } else if (this.singleRow) {
                    data = rows[0] as any
                }
            }
            return { data, error: null }
        }

        return { data: null, error: new Error('Unsupported builder action') }
    }
}

export const supabaseAdmin = {
    from(table: string) {
        return new SupabaseQueryBuilder(table)
    },
    rpc(name: string, args?: any) {
        return new SupabaseQueryBuilder('').rpc(name, args)
    },
    auth: {
        admin: {
            createUser: async (payload: any) => {
                try {
                    const id = crypto.randomUUID()
                    const { email, password, user_metadata } = payload
                    const hashedPassword = await bcrypt.hash(password, 12)
                    await pool.query(
                        `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
                         VALUES ($1, $2, $3, NOW(), 'authenticated', 'authenticated',
                                 '{"provider": "email", "providers": ["email"]}'::jsonb, $4)
                         ON CONFLICT (email) DO NOTHING`,
                        [id, email, hashedPassword, JSON.stringify(user_metadata || {})]
                    )
                    // Return existing id if conflict
                    const { rows } = await pool.query(`SELECT id FROM auth.users WHERE email = $1`, [email])
                    return { data: { user: { id: rows[0]?.id ?? id } }, error: null }
                } catch (err: any) {
                    console.error('[Admin CreateUser Error]:', err)
                    return { data: { user: null }, error: err }
                }
            },
            updateUserById: async (id: string, updates: { password?: string; email?: string; email_confirm?: boolean }) => {
                try {
                    const sets: string[] = []
                    const params: any[] = []
                    let paramIdx = 1

                    if (updates.password) {
                        const hashed = await bcrypt.hash(updates.password, 12)
                        sets.push(`encrypted_password = $${paramIdx++}`)
                        params.push(hashed)
                    }
                    if (updates.email) {
                        sets.push(`email = $${paramIdx++}`)
                        params.push(updates.email)
                    }
                    if (updates.email_confirm) {
                        sets.push(`email_confirmed_at = NOW()`)
                    }
                    if (sets.length === 0) return { data: {}, error: null }

                    params.push(id)
                    const sql = `UPDATE auth.users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${paramIdx} RETURNING id`
                    const { rows } = await pool.query(sql, params)

                    if (rows.length === 0) {
                        return { data: null, error: new Error(`Auth user not found for id: ${id}`) }
                    }
                    return { data: { user: rows[0] }, error: null }
                } catch (err: any) {
                    console.error('[Admin UpdateUserById Error]:', err)
                    return { data: null, error: err }
                }
            },
            listUsers: async (options?: { perPage?: number }) => {
                try {
                    const limit = options?.perPage ?? 1000
                    const { rows } = await pool.query(
                        `SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT $1`,
                        [limit]
                    )
                    return { data: { users: rows }, error: null }
                } catch (err: any) {
                    console.error('[Admin ListUsers Error]:', err)
                    return { data: { users: [] }, error: err }
                }
            },
            deleteUser: async (id: string) => {
                try {
                    await pool.query(`DELETE FROM auth.users WHERE id = $1`, [id])
                    return { data: {}, error: null }
                } catch (err: any) {
                    console.error('[Admin DeleteUser Error]:', err)
                    return { data: null, error: err }
                }
            }
        }
    }
}


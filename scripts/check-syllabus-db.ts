import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })
if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^"|"$/g, '')
}

import { Pool } from 'pg'
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
})
const query = (text: string, params?: any[]) => pool.query(text, params)

async function main() {
    try {
        const boards = await query("SELECT id, name, type, tenant_id FROM public.syllabus_nodes WHERE type = 'board'")
        console.log('Boards:', boards.rows)

        const classes = await query("SELECT id, name, type, parent_id, tenant_id FROM public.syllabus_nodes WHERE type = 'class'")
        console.log('Syllabus Classes count:', classes.rows.length, 'sample:', classes.rows.slice(0, 3))

        const subjects = await query("SELECT id, name, type, parent_id, tenant_id FROM public.syllabus_nodes WHERE type = 'subject'")
        console.log('Syllabus Subjects count:', subjects.rows.length, 'sample:', subjects.rows.slice(0, 3))

        const chapters = await query("SELECT id, name, type, parent_id, tenant_id FROM public.syllabus_nodes WHERE type = 'chapter'")
        console.log('Syllabus Chapters count:', chapters.rows.length, 'sample:', chapters.rows.slice(0, 3))

        const topics = await query("SELECT id, name, type, parent_id, tenant_id FROM public.syllabus_nodes WHERE type = 'topic'")
        console.log('Syllabus Topics count:', topics.rows.length, 'sample:', topics.rows.slice(0, 3))

        const tenants = await query("SELECT id, name FROM public.tenants LIMIT 5")
        console.log('Tenants:', tenants.rows)

        const tenantSyllabus = await query("SELECT * FROM public.tenant_syllabus")
        console.log('Tenant Syllabus rows:', tenantSyllabus.rows)

        const dbClasses = await query("SELECT id, name, tenant_id FROM public.classes LIMIT 10")
        console.log('DB classes:', dbClasses.rows)

        const dbSubjects = await query("SELECT id, name, tenant_id FROM public.subjects LIMIT 10")
        console.log('DB subjects:', dbSubjects.rows)
    } catch (e) {
        console.error('Error:', e)
    } finally {
        process.exit(0)
    }
}

main()

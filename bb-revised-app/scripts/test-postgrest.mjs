import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseAdmin = createClient(
    'https://bfzlkdurgggzytegvvrw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU'
)

async function run() {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const adminUser = usersData.users.find(u => u.email === 'admin@brilliantacademy.edu')
    const userId = adminUser.id
    
    let output = `Testing admin ID: ${userId}\n`

    let q1 = await supabaseAdmin.from('user_profiles').select(`role, first_name, tenant_id`).eq('id', userId).single()
    output += 'Q1 (no tenant): ' + (q1.error ? JSON.stringify(q1.error) : 'OK') + '\n'

    let q2 = await supabaseAdmin.from('user_profiles').select(`role, first_name, tenant_id, tenants (*)`).eq('id', userId).single()
    output += 'Q2 (tenants (*)): ' + (q2.error ? JSON.stringify(q2.error) : 'OK') + '\n'

    let q3 = await supabaseAdmin.from('user_profiles').select(`role, first_name, tenant_id, tenants:tenant_id (*)`).eq('id', userId).single()
    output += 'Q3 (tenants:tenant_id (*)): ' + (q3.error ? JSON.stringify(q3.error) : ('OK -> ' + JSON.stringify(q3.data))) + '\n'

    fs.writeFileSync('scripts/out4.txt', output, 'utf-8')
    console.log('Done, wrote out4.txt')
}

run()

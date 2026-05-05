import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env', 'utf8')
const env = Object.fromEntries(
    envContent
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('=').map(part => part.trim()))
)

const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
)

async function listUsers() {
    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('email, role, tenant_id, is_active')
        .limit(20)

    if (error) {
        console.error('Error fetching profiles:', error)
    } else {
        console.log('--- USER PROFILES ---')
        profiles.forEach(p => {
            console.log(`Email: ${p.email} | Role: ${p.role} | Active: ${p.is_active}`)
        })
    }
}

listUsers()

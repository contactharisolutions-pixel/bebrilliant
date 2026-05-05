import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkRoles() {
    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, role, email')
        .limit(10)
    
    if (error) console.error('Error:', error)
    else console.log('User Profiles:', JSON.stringify(profiles, null, 2))
}

checkRoles()

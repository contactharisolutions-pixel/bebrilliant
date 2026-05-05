const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '.env.local') })
dotenv.config({ path: path.resolve(__dirname, '.env') })

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRoles() {
    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, role')
        .limit(10)
    
    if (error) console.error('Error:', error)
    else console.log('User Profiles:', JSON.stringify(profiles, null, 2))
}

checkRoles()

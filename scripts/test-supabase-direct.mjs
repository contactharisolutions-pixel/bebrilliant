import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing connection to:', supabaseUrl)

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials in environment')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log('Fetching users...')
    try {
        const { data, error } = await supabase.auth.admin.listUsers()
        
        if (error) {
            console.error('Connection Error:', error.message)
        } else {
            console.log('Connection Success! Found', data?.users?.length, 'users.')
            if (data?.users) {
                console.log('First 3 users:')
                data.users.slice(0, 3).forEach(u => console.log(`- ${u.email} (${u.id})`))
            }
        }
    } catch (err) {
        console.error('Execution Error:', err.message)
    }
    process.exit(0)
}

test()

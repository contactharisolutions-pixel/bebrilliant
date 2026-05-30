import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log('Fetching user_profiles...')
    try {
        const { data, error } = await supabase.from('user_profiles').select('*').limit(5)
        if (error) {
            console.error('Profiles Fetch Error:', error.message)
        } else {
            console.log('Profiles:', JSON.stringify(data, null, 2))
        }
    } catch (e) {
        console.error(e)
    }
}

test()

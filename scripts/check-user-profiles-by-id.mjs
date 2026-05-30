import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const ids = [
    'b55cf8d7-b60c-403a-80fa-cbce8ecc5374',
    '9e68a0a7-e4da-40d8-9987-f25bb608c966',
    '8a4b744c-faaa-45bf-bc49-ace00cf9e0ce'
]

async function test() {
    console.log('Fetching user_profiles for IDs...')
    try {
        const { data, error } = await supabase.from('user_profiles').select('*').in('id', ids)
        if (error) {
            console.error('Profiles Fetch Error:', error.message)
        } else {
            console.log('Profiles Found:', JSON.stringify(data, null, 2))
        }
    } catch (e) {
        console.error(e)
    }
}

test()

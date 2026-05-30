import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing connection to:', supabaseUrl)

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log('Fetching users...')
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
        console.error('Connection Error:', error.message)
    } else {
        console.log('Connection Success! Found', users?.length, 'users.')
    }
}

test()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bfzlkdurgggzytegvvrw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU'

console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function test() {
    console.log('Testing auth...')
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'fixer@brightboard.in',
        password: 'Password@123'
    })
    if (error) {
        console.error('Auth Error:', error.message)
        return
    }
    console.log('Auth Success. Fetching profile...')
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
    
    if (profileError) {
        console.error('Profile Error:', profileError.message)
    } else {
        console.log('Profile Success:', profile)
    }
}

test()

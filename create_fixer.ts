import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bfzlkdurgggzytegvvrw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function create() {
    const email = 'fixer@brightboard.in'
    const password = 'Password@123'
    
    console.log(`Creating user ${email}...`)
    const { data: { user }, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'owner' }
    })
    
    if (error || !user) {
        console.error('Create Error:', error?.message)
        return
    }
    
    console.log('User created:', user.id)
    
    const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
            id: user.id,
            email: email,
            role: 'owner',
            is_active: true,
            is_first_login: false,
            first_name: 'Fixer',
            last_name: 'Admin'
        })
    
    if (profileError) {
        console.error('Profile Error:', profileError.message)
    } else {
        console.log('Profile created. You can now login with:', email, '/', password)
    }
}

create()

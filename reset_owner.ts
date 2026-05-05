import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bfzlkdurgggzytegvvrw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA5Mjc2NywiZXhwIjoyMDg5NjY4NzY3fQ.uB2xQv9Zcd2U67IZ7nqTZm0et4mc4HRg0R5w5RgfenU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function reset() {
    const email = 'owner@brightboard.in'
    const newPassword = 'Demo@123'
    
    console.log(`Resetting password for ${email}...`)
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
        console.error('List Error:', listError.message)
        return
    }
    
    const user = users.find(u => u.email === email)
    if (!user) {
        console.error('User not found')
        return
    }
    
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
    
    if (error) {
        console.error('Reset Error:', error.message)
    } else {
        console.log('Password reset successfully to:', newPassword)
    }
}

reset()

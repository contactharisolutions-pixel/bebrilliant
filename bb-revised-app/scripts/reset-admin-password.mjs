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

async function resetPassword() {
    const email = 'admin@bebrilliant.in'
    const newPassword = 'Life@20242526'

    console.log(`Searching for user with email: ${email}...`)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
        console.error(`User with email ${email} not found in auth.users`)
        return
    }

    console.log(`Found user ID: ${user.id}. Resetting password...`)

    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    )

    if (error) {
        console.error('Error updating password:', error)
    } else {
        console.log(`Password for ${email} has been successfully reset to: ${newPassword}`)
    }
}

resetPassword()

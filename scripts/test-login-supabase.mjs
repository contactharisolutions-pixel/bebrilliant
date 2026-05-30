import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple custom .env parser
function loadEnvFile(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        content.split('\n').forEach(line => {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split('=')
                if (parts.length >= 2) {
                    const key = parts[0].trim()
                    let value = parts.slice(1).join('=').trim()
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1)
                    }
                    if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.substring(1, value.length - 1)
                    }
                    process.env[key] = value
                }
            }
        })
    }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Using Supabase URL:', supabaseUrl)

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing public credentials in environment')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const testUsers = [
    'rahul@shahclasses.com',
    'owner@brightboard.in',
    'admin@brilliantacademy.edu',
    'aisha.student@shahclasses.com',
    'fixer@brightboard.in'
]

async function testLogins() {
    for (const email of testUsers) {
        console.log(`\nTesting login for: ${email}`)
        for (const password of ['Demo@123', 'Password@123']) {
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) {
                    console.log(`  Password '${password}': FAILED - ${error.message}`)
                } else {
                    console.log(`  Password '${password}': SUCCESS! User ID: ${data.user.id}`)
                    await supabase.auth.signOut()
                    break
                }
            } catch (err) {
                console.log(`  Password '${password}': ERROR - ${err.message}`)
            }
        }
    }
}

testLogins()

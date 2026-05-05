const fetch = globalThis.fetch;

const SUPABASE_URL = 'https://bfzlkdurgggzytegvvrw.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmemxrZHVyZ2dnenl0ZWd2dnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI3NjcsImV4cCI6MjA4OTY2ODc2N30.sCCi4Mt_ZVBnC9xzulneuXbjSK7tu06OHiqJezAuGhs'

async function run() {
    const email = 'owner_final@brightboard.in'
    console.log(`📝 Signing up ${email}...`)
    
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'apikey': ANON_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: 'Demo@123'
        })
    })
    
    const data = await res.json()
    console.log('HTTP', res.status)
    console.log('Body:', data)
}

run();

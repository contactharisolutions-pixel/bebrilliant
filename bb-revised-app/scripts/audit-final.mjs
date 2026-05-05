const fetch = globalThis.fetch;
const BASE = 'http://localhost:3000'

const USERS = [
    { email: 'owner@brightboard.in', expectedRole: 'owner' },
    { email: 'admin@brilliantacademy.edu', expectedRole: 'tenant_admin' },
    { email: 'deepak.teacher@sunriseschool.edu', expectedRole: 'teacher' },
    { email: 'rahul@shahclasses.com', expectedRole: 'tenant_admin' },
    { email: 'aisha.student@shahclasses.com', expectedRole: 'student' }
]

async function run() {
    console.log('=== Login -> Dashboard Audit (Final) ===\n')
    for (const u of USERS) {
        process.stdout.write(`Testing ${u.email}... `)
        const loginRes = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email, password: 'Demo@1234' }),
            redirect: 'manual'
        })
        const setCookieHeader = loginRes.headers.get('set-cookie')
        if (!loginRes.ok) { console.log('❌ Login failed'); continue }
        
        const meRes = await fetch(`${BASE}/api/auth/me`, {
            headers: setCookieHeader ? { 'Cookie': setCookieHeader } : {}
        })
        
        if (meRes.ok) {
            const data = await meRes.json()
            console.log(`✅ OK >> Role: ${data.role} | Tenant ID: ${data.tenant_id}`)
        } else {
            console.log(`❌ /me failed: HTTP ${meRes.status}`)
        }
    }
    console.log('\n=== Audit Complete ===')
}
run()

const fetch = globalThis.fetch;
const BASE = 'http://localhost:3000'

async function testUser(email, expectedRole) {
    console.log(`Testing ${email}...`)
    
    // 1. Hit the login API
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Demo@1234' }),
        redirect: 'manual'
    })
    const setCookieHeader = loginRes.headers.get('set-cookie')
    
    // 2. Call /api/auth/me
    const meRes = await fetch(`${BASE}/api/auth/me`, {
        headers: setCookieHeader ? { 'Cookie': setCookieHeader } : {}
    })
    if (meRes.ok) {
        console.log(`✅ LOGIN OK /me -> HTTP 200`)
    } else {
        const err = await meRes.text()
        console.log(`❌ /me -> HTTP ${meRes.status}: ${err}`)
    }
}

testUser('admin@brilliantacademy.edu')

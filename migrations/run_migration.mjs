import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((a, l) => {
    const idx = l.indexOf('=');
    if (idx > 0) { const k = l.slice(0, idx).trim(); const v = l.slice(idx+1).trim(); a[k] = v; }
    return a;
}, {});

const url = env['SUPABASE_URL'];
const key = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log(`Supabase URL: ${url}`);

// Use PostgREST's /rpc endpoint or direct table schema additions
// Try via the pg-meta or direct REST approach
const headers = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=minimal'
};

// Test connection first
try {
    const r = await fetch(`${url}/rest/v1/syllabus_nodes?select=id&limit=1`, { headers });
    console.log('Connection test:', r.status, r.ok ? 'OK' : await r.text());
} catch(e) {
    console.log('Connection error:', e.message);
    process.exit(1);
}

// The correct approach for self-hosted Supabase is to use the management API or direct DB
// Check if there's a pg endpoint
const pgEndpoints = [
    `${url}/pg/query`,
    `${url}/api/pg/query`,
    `${url}/database/query`,
];

for (const ep of pgEndpoints) {
    try {
        const r = await fetch(ep, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: 'SELECT 1' })
        });
        const t = await r.text();
        console.log(`Endpoint ${ep}: ${r.status} -> ${t.slice(0,80)}`);
    } catch(e) {
        console.log(`Endpoint ${ep}: network error`);
    }
}

// Output the SQL for manual execution if needed
console.log('\n========== MANUAL SQL TO RUN IN SUPABASE SQL EDITOR ==========');
const sql = fs.readFileSync('./migrations/syllabus_enterprise_v2.sql', 'utf8');
console.log(sql);

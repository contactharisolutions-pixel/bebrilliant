import pg from 'pg'
const { Client } = pg

const client = new Client({
    connectionString: 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
})

async function run() {
    await client.connect()

    // Check tenants columns
    const { rows: cols } = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants' ORDER BY ordinal_position`
    )
    process.stdout.write('tenants columns: ' + cols.map(r => r.column_name).join(', ') + '\n')

    // Check FK from user_profiles -> tenants
    const { rows: fk } = await client.query(`
        SELECT kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_col
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'user_profiles' AND tc.constraint_type = 'FOREIGN KEY'
    `)
    process.stdout.write('FK constraints: ' + JSON.stringify(fk) + '\n')

    // Test the exact SELECT that /api/auth/me uses for admin
    const { rows: [adminUser] } = await client.query(
        `SELECT id FROM auth.users WHERE email = 'admin@brilliantacademy.edu'`
    )
    process.stdout.write('Admin user ID: ' + (adminUser?.id || 'NOT FOUND') + '\n')
    
    if (adminUser) {
        const { rows } = await client.query(`
            SELECT p.role, p.first_name, p.tenant_id, t.name as tenant_name
            FROM user_profiles p
            LEFT JOIN tenants t ON t.id = p.tenant_id
            WHERE p.id = $1
        `, [adminUser.id])
        process.stdout.write('Join result: ' + JSON.stringify(rows[0]) + '\n')
    }
    
    // Also test owner (no tenant)
    const { rows: [ownerUser] } = await client.query(
        `SELECT id FROM auth.users WHERE email = 'owner@brightboard.in'`
    )
    process.stdout.write('Owner user ID: ' + (ownerUser?.id || 'NOT FOUND') + '\n')
    
    if (ownerUser) {
        const { rows } = await client.query(`
            SELECT p.role, p.first_name, p.tenant_id, t.name as tenant_name
            FROM user_profiles p
            LEFT JOIN tenants t ON t.id = p.tenant_id
            WHERE p.id = $1
        `, [ownerUser.id])
        process.stdout.write('Owner join result: ' + JSON.stringify(rows[0]) + '\n')
    }

    await client.end()
}

run().catch(e => { process.stdout.write('ERROR: ' + e.message + '\n'); client.end() })

import pg from 'pg';
const { Client } = pg;

// Using the working Supabase project
const connectionString = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

async function deepAudit() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('✅ Connected to Postgres\n');

        // 1. List all auth users
        console.log('=== AUTH USERS ===');
        const users = await client.query(`
            SELECT id, email, email_confirmed_at, created_at, last_sign_in_at,
                   raw_user_meta_data->>'role' as meta_role
            FROM auth.users
            ORDER BY created_at
        `);
        users.rows.forEach(u => {
            console.log(`  ${u.email} | confirmed: ${!!u.email_confirmed_at} | last_login: ${u.last_sign_in_at || 'never'}`);
        });

        // 2. List all profiles
        console.log('\n=== USER PROFILES ===');
        const profiles = await client.query(`
            SELECT up.id, up.email, up.role, up.is_active, up.is_first_login,
                   up.first_name, up.last_name, t.name as tenant_name
            FROM user_profiles up
            LEFT JOIN tenants t ON t.id = up.tenant_id
            ORDER BY up.role, up.email
        `);
        profiles.rows.forEach(p => {
            console.log(`  [${p.role}] ${p.email} | active: ${p.is_active} | first_login: ${p.is_first_login} | tenant: ${p.tenant_name || 'owner/none'} | name: ${p.first_name} ${p.last_name}`);
        });

        // 3. List all tenants
        console.log('\n=== TENANTS ===');
        const tenants = await client.query(`
            SELECT id, name, type, tenant_type, email, is_active, subscription_status
            FROM tenants ORDER BY created_at
        `);
        tenants.rows.forEach(t => {
            console.log(`  [${t.type}] ${t.name} | email: ${t.email} | active: ${t.is_active} | status: ${t.subscription_status}`);
        });

        // 4. Performance: check for missing indexes on common query columns
        console.log('\n=== INDEX AUDIT ===');
        const indexes = await client.query(`
            SELECT tablename, indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);
        const tables = {};
        indexes.rows.forEach(idx => {
            if (!tables[idx.tablename]) tables[idx.tablename] = [];
            tables[idx.tablename].push(idx.indexname);
        });
        Object.entries(tables).forEach(([table, idxs]) => {
            console.log(`  ${table}: ${idxs.join(', ')}`);
        });

        // 5. Check RLS status (can slow queries if infinite recursion)
        console.log('\n=== RLS STATUS ===');
        const rls = await client.query(`
            SELECT tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        rls.rows.forEach(r => {
            console.log(`  ${r.tablename}: RLS=${r.rowsecurity}`);
        });

    } catch (e) {
        console.error('Audit Error:', e.message);
    } finally {
        await client.end();
    }
}

deepAudit();

import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

async function getUsers() {
    const client = new Client({ connectionString });
    try {
        await client.connect();

        const users = await client.query(`
            SELECT 
                au.email,
                up.role,
                up.is_active,
                up.is_first_login,
                up.first_name,
                up.last_name,
                t.name as tenant_name,
                au.email_confirmed_at IS NOT NULL as confirmed
            FROM auth.users au
            LEFT JOIN user_profiles up ON up.id = au.id
            LEFT JOIN tenants t ON t.id = up.tenant_id
            ORDER BY up.role, au.email
        `);

        console.log('\n=== ALL USERS WITH CREDENTIALS ===\n');
        users.rows.forEach(u => {
            console.log(`Email    : ${u.email}`);
            console.log(`Password : Demo@123 (or Password@123 for fixer)`);
            console.log(`Role     : ${u.role || 'NO PROFILE'}`);
            console.log(`Name     : ${u.first_name || ''} ${u.last_name || ''}`);
            console.log(`Tenant   : ${u.tenant_name || 'Platform Owner / None'}`);
            console.log(`Active   : ${u.is_active} | First Login: ${u.is_first_login} | Confirmed: ${u.confirmed}`);
            console.log('---');
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

getUsers();

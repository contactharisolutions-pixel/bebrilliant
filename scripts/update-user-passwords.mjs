import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

async function updatePasswords() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        console.log('Updating passwords of all users to "Demo@123"...');
        
        const res = await client.query(`
            UPDATE auth.users 
            SET encrypted_password = crypt('Demo@123', gen_salt('bf'))
            RETURNING email
        `);
        
        console.log(`Successfully updated ${res.rowCount} users' passwords!`);
        res.rows.forEach(r => console.log(`- ${r.email}`));

    } catch (e) {
        console.error('Error during password update:', e.message);
    } finally {
        await client.end();
    }
}

updatePasswords();

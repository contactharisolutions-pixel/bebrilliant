import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://postgres:Life%4020242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres'

async function run() {
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
    await client.connect()
    
    const newEmail = 'system_admin@brightboard.in'
    const newId = '77777777-6666-5555-4444-333333333333'
    
    console.log(`🏗️ Creating fresh ${newEmail}...`)
    
    // Copy student 123 template
    const { rows: student } = await client.query("SELECT * FROM auth.users WHERE email = 'test_student_123@brightboard.in'")
    const s = student[0]
    
    await client.query(`
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
            is_super_admin, created_at, updated_at, phone, 
            phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
    `, [
        newId, s.instance_id, s.aud, s.role, newEmail, s.encrypted_password,
        s.email_confirmed_at, s.last_sign_in_at, s.raw_app_meta_data, 
        JSON.stringify({ sub: newId, email: newEmail, email_verified: true, role: 'owner' }),
        false, s.created_at, s.updated_at, s.phone, s.phone_confirmed_at,
        s.is_sso_user, s.deleted_at, s.is_anonymous
    ])
    
    await client.query(`
        INSERT INTO public.user_profiles (id, email, role, is_active, is_first_login, first_name, last_name)
        VALUES ($1, $2, 'owner', TRUE, FALSE, 'System', 'Admin')
    `, [newId, newEmail])
    
    console.log('✅ Created. Try login with:', newEmail)
    await client.end()
}

run().catch(console.error)

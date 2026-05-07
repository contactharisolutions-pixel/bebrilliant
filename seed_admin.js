/**
 * BlinkOpticals — ERP Admin Seed Script
 * Creates the first admin user in the database
 */
require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const ADMIN = {
    user_id:     'usr_admin_001',
    business_id: 'biz_blink_001',
    name:        'Blink Admin',
    email:       'admin@blinkopticals.com',
    mobile:      '9999999999',
    role:        'Admin',
    password:    'Blink@Admin2026'
};

async function seed() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        // 1. Ensure business exists
        await client.query(`
            INSERT INTO business (business_id, business_name, owner_name, mobile_number, email, city, state)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (business_id) DO NOTHING
        `, [ADMIN.business_id, 'BlinkOpticals', ADMIN.name, ADMIN.mobile, ADMIN.email, 'Surat', 'Gujarat']);
        console.log('✓ Business record ready');

        // 2. Hash password
        const password_hash = await bcrypt.hash(ADMIN.password, 12);

        // 3. Upsert admin user
        await client.query(`
            INSERT INTO app_user (user_id, business_id, name, mobile, email, role, password_hash, active_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            ON CONFLICT (user_id) DO UPDATE
            SET email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                active_status = true
        `, [ADMIN.user_id, ADMIN.business_id, ADMIN.name, ADMIN.mobile, ADMIN.email, ADMIN.role, password_hash]);

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║    ERP Admin Credentials Created ✓       ║');
        console.log('╠══════════════════════════════════════════╣');
        console.log(`║  URL    : http://localhost:5174/admin     ║`);
        console.log(`║  Email  : ${ADMIN.email}       ║`);
        console.log(`║  Pass   : ${ADMIN.password}         ║`);
        console.log(`║  Role   : ${ADMIN.role}                      ║`);
        console.log('╚══════════════════════════════════════════╝\n');

    } catch (err) {
        console.error('Seed failed:', err.message);
    } finally {
        await client.end();
    }
}

seed();

import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

async function createRPCs() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected. Creating RPCs...\n');

        // 1. check_user_permission
        await client.query(`
            CREATE OR REPLACE FUNCTION check_user_permission(p_user_id uuid, p_key text)
            RETURNS boolean AS $$
            DECLARE
            v_perm_id uuid;
            v_has boolean;
            BEGIN
            -- 1. Get the requested permission's UUID
            SELECT id INTO v_perm_id FROM permissions WHERE key = p_key LIMIT 1;
            IF v_perm_id IS NULL THEN
                RETURN false;
            END IF;

            -- 2. Owner override
            IF EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id AND role = 'owner') THEN
                RETURN true;
            END IF;

            -- 3. Check role_permissions
            SELECT EXISTS (
                SELECT 1 
                FROM role_permissions rp
                WHERE rp.permission_id = v_perm_id
                AND rp.role_id IN (
                SELECT role_id FROM user_roles WHERE user_id = p_user_id
                UNION
                SELECT r.id FROM user_profiles p
                JOIN roles r ON r.name = p.role
                WHERE p.id = p_user_id
                )
            ) INTO v_has;

            RETURN v_has;
            END;
            $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
        `);
        console.log('✅ Created check_user_permission RPC');

        // 2. get_tenant_revenue
        await client.query(`
            CREATE OR REPLACE FUNCTION get_tenant_revenue(p_tenant_id uuid)
            RETURNS numeric AS $$
            SELECT COALESCE(SUM(amount), 0) FROM payments WHERE tenant_id = p_tenant_id AND status = 'success';
            $$ LANGUAGE sql STABLE SECURITY DEFINER;
        `);
        console.log('✅ Created get_tenant_revenue RPC');

        // 3. get_platform_revenue
        await client.query(`
            CREATE OR REPLACE FUNCTION get_platform_revenue()
            RETURNS numeric AS $$
            SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success';
            $$ LANGUAGE sql STABLE SECURITY DEFINER;
        `);
        console.log('✅ Created get_platform_revenue RPC');

        console.log('\n🎉 All RPCs created successfully!');
    } catch (e) {
        console.error('RPC Error:', e.message);
    } finally {
        await client.end();
    }
}

createRPCs();

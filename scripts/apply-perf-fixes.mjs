import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

async function applyFixes() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected. Applying performance fixes...\n');

        // 1. Critical: user_profiles - tenant_id index (used on every API request)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles(tenant_id)`);
        console.log('✅ idx_user_profiles_tenant_id');

        // 2. tenant_subscriptions - tenant_id (checked on every dashboard load)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id)`);
        console.log('✅ idx_tenant_subscriptions_tenant_id');

        // 3. payments - tenant_id, user_id (finance dashboard)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id)`);
        console.log('✅ idx_payments_tenant_id');
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_id ON payments(user_id)`);
        console.log('✅ idx_payments_user_id');
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC)`);
        console.log('✅ idx_payments_created_at');

        // 4. exams - tenant_id (exams list)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exams_tenant_id ON exams(tenant_id)`);
        console.log('✅ idx_exams_tenant_id');

        // 5. exam_attempts - student_id, exam_id (student dashboard)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_attempts_student_id ON exam_attempts(student_id)`);
        console.log('✅ idx_exam_attempts_student_id');
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id)`);
        console.log('✅ idx_exam_attempts_exam_id');

        // 6. leads - tenant_id (CRM)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id)`);
        console.log('✅ idx_leads_tenant_id');

        // 7. syllabus_nodes - tenant_id (AI syllabus)
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_syllabus_nodes_tenant_id ON syllabus_nodes(tenant_id)`);
        console.log('✅ idx_syllabus_nodes_tenant_id');

        // 8. attendance_logs - student_id, tenant_id
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_student_id ON attendance_logs(student_id)`);
        console.log('✅ idx_attendance_student_id');
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_tenant_id ON attendance_logs(tenant_id)`);
        console.log('✅ idx_attendance_tenant_id');

        // 9. notifications - created_at
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
        console.log('✅ idx_notifications_created_at');

        // 10. omr_exams, online_exams - tenant_id
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_omr_exams_tenant_id ON omr_exams(tenant_id)`);
        console.log('✅ idx_omr_exams_tenant_id');
        await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_online_exams_tenant_id ON online_exams(tenant_id)`);
        console.log('✅ idx_online_exams_tenant_id');

        // 11. Fix tenant_member_read RLS policy (may be missing - causing all API calls to fall back to slow path)
        await client.query(`
            DROP POLICY IF EXISTS "tenant_member_read" ON user_profiles;
            CREATE POLICY "tenant_member_read"
            ON user_profiles FOR SELECT
            USING (
                tenant_id IS NOT NULL
                AND tenant_id = (
                    SELECT tenant_id FROM user_profiles WHERE id = auth.uid() LIMIT 1
                )
            );
        `);
        console.log('✅ Fixed tenant_member_read RLS policy');

        // 12. Fix tenant_admin_update RLS policy (potential recursion)
        await client.query(`
            DROP POLICY IF EXISTS "tenant_admin_update" ON user_profiles;
            CREATE POLICY "tenant_admin_update"
            ON user_profiles FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM user_profiles up2
                    WHERE up2.id = auth.uid()
                    AND up2.role IN ('tenant_admin', 'owner')
                    LIMIT 1
                )
            );
        `);
        console.log('✅ Fixed tenant_admin_update RLS policy');

        console.log('\n🎉 All performance fixes applied successfully!');
    } catch (e) {
        console.error('Fix Error:', e.message);
    } finally {
        await client.end();
    }
}

applyFixes();

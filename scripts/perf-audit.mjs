import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';

async function perfAudit() {
    const client = new Client({ connectionString });
    try {
        await client.connect();

        // Check missing critical indexes
        const missingIndexes = await client.query(`
            SELECT tablename, attname as column_name
            FROM pg_attribute pa
            JOIN pg_class pc ON pc.oid = pa.attrelid
            JOIN pg_tables pt ON pt.tablename = pc.relname AND pt.schemaname = 'public'
            WHERE pa.attname IN ('tenant_id', 'user_id', 'student_id', 'exam_id', 'created_at')
            AND pa.attnum > 0
            AND NOT EXISTS (
                SELECT 1 FROM pg_index pi
                JOIN pg_attribute pia ON pia.attrelid = pi.indrelid AND pia.attnum = ANY(pi.indkey)
                WHERE pi.indrelid = pc.oid AND pia.attname = pa.attname
            )
            ORDER BY tablename, column_name
        `);
        
        console.log('\n=== MISSING INDEXES (Performance Risk) ===');
        if (missingIndexes.rows.length === 0) {
            console.log('  ✅ No missing critical indexes found.');
        } else {
            missingIndexes.rows.forEach(r => {
                console.log(`  ⚠️  ${r.tablename}.${r.column_name} - MISSING INDEX`);
            });
        }

        // Check table sizes
        const tableSizes = await client.query(`
            SELECT relname as table_name,
                   n_live_tup as row_count
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
            ORDER BY n_live_tup DESC
            LIMIT 15
        `);
        console.log('\n=== TABLE ROW COUNTS (Top 15) ===');
        tableSizes.rows.forEach(r => {
            console.log(`  ${r.table_name}: ${r.row_count} rows`);
        });

        // Check for RLS recursion risk on user_profiles
        const rlsPolicies = await client.query(`
            SELECT tablename, policyname, cmd, qual
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'user_profiles'
        `);
        console.log('\n=== USER_PROFILES RLS POLICIES ===');
        rlsPolicies.rows.forEach(p => {
            const hasRecursion = p.qual && p.qual.includes('user_profiles');
            console.log(`  ${p.policyname} (${p.cmd}): ${hasRecursion ? '⚠️  RECURSIVE' : '✅ OK'}`);
        });

    } catch (e) {
        console.error('Perf Audit Error:', e.message);
    } finally {
        await client.end();
    }
}

perfAudit();

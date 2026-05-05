import pg from 'pg';

const oldDbUrl = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';
const newDbUrl = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';

const tableOrder = [
  'tenants',
  'auth.users',
  'user_profiles',
  'syllabus_nodes',
  'questions',
  'exams',
  'online_exams',
  'exam_config',
  'exam_questions',
  'online_exam_questions',
  'leads',
  'student_wallets',
  'payments',
  'payment_splits',
  'owner_wallet',
  'tenant_wallet',
  'exam_attempts',
  'online_exam_attempts',
  'answers',
  'online_exam_answers',
  'attendance_logs',
  'study_materials',
  'offline_result_uploads',
  'analytics_logs',
  'student_performance',
  'exam_enrollments',
  'affiliates',
  'marketplace_products',
  'student_purchases',
  'courses',
  'course_lessons',
  'lesson_progress',
  'doubts',
  'doubt_answers'
];

// Columns to exclude for specific tables (usually system-managed)
const excludeColumns = {
  'auth.users': [
    'confirmed_at', 
    'confirmation_sent_at', 
    'recovery_sent_at', 
    'email_change_sent_at',
    'last_sign_in_at',
    'created_at',
    'updated_at',
    'phone_confirmed_at',
    'phone_change_sent_at',
    'reauthentication_sent_at'
  ]
};

async function migrateTable(oldClient, newClient, fullName) {
  const [schema, name] = fullName.includes('.') ? fullName.split('.') : ['public', fullName];
  console.log(`Migrating ${schema}.${name}...`);
  try {
    const checkRes = await newClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = $2
      )
    `, [schema, name]);
    
    if (!checkRes.rows[0].exists) {
      console.warn(`  Table ${schema}.${name} does not exist in target. Skipping.`);
      return;
    }

    const res = await oldClient.query(`SELECT * FROM ${schema}.${name}`);
    if (res.rows.length === 0) {
      console.log(`  No data in ${name}.`);
      return;
    }

    let columns = Object.keys(res.rows[0]);
    
    // Filter out excluded columns
    if (excludeColumns[fullName]) {
      columns = columns.filter(c => !excludeColumns[fullName].includes(c));
    }

    const colNames = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    let successCount = 0;
    let skipCount = 0;
    for (const row of res.rows) {
      const values = columns.map(col => row[col]);
      try {
        await newClient.query(
          `INSERT INTO ${schema}.${name} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        successCount++;
      } catch (e) {
        if (e.message.includes('already exists')) {
          skipCount++;
        } else {
          console.error(`    Row error in ${name}:`, e.message);
        }
      }
    }
    console.log(`  Successfully migrated ${successCount}/${res.rows.length} rows to ${name} (${skipCount} skipped due to conflicts).`);
  } catch (err) {
    console.error(`  Error migrating ${name}:`, err.message);
  }
}

async function run() {
  const oldClient = new pg.Client({ connectionString: oldDbUrl });
  const newClient = new pg.Client({ connectionString: newDbUrl });

  try {
    await oldClient.connect();
    await newClient.connect();
    console.log('Connected to both databases.');

    console.log('Disabling triggers...');
    await newClient.query('SET session_replication_role = "replica"');

    for (const table of tableOrder) {
      await migrateTable(oldClient, newClient, table);
    }

    await newClient.query('SET session_replication_role = "origin"');
    console.log('Triggers re-enabled.');

    console.log('\nData migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

run();

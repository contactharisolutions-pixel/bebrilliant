const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { Client } = require('pg');
const client = new Client({ connectionString: env.DATABASE_URL });

async function checkCols() {
  await client.connect();
  
  // Columns of tenants
  const tCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tenants' 
    ORDER BY ordinal_position;
  `);
  console.log('Tenants columns:', tCols.rows.map(r => r.column_name));
  
  // Sample tenant
  const tData = await client.query('SELECT * FROM tenants LIMIT 2');
  console.log('Tenants sample:', tData.rows);
  
  // Columns of payments
  const pCols = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'payments';
  `);
  console.log('\nPayments columns:', pCols.rows.map(r => r.column_name));
  const pData = await client.query('SELECT * FROM payments LIMIT 5');
  console.log('Payments sample:', pData.rows);

  // Audit logs columns and sample
  const aCols = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'audit_logs';
  `);
  console.log('\nAudit logs cols:', aCols.rows.map(r => r.column_name));
  const aData = await client.query('SELECT * FROM audit_logs LIMIT 5');
  console.log('Audit logs sample:', aData.rows);

  // Tickets / tasks / support
  console.log('\n--- Support/Task Tables ---');
  const ticketTables = ['platform_tasks', 'task', 'demo_requests', 'demos', 'owner_leads', 'onboarding_cases', 'training_cases'];
  for (const tb of ticketTables) {
    try {
      const res = await client.query('SELECT count(*) FROM "' + tb + '"');
      console.log(tb + ' count: ' + res.rows[0].count);
    } catch(e) {
      console.log(tb + ' error: ' + e.message);
    }
  }

  // Check if there is any table with 'ticket' in name
  const allTicketTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%ticket%';
  `);
  console.log('\nTables matching %ticket%:', allTicketTables.rows.map(r => r.table_name));

  // Check if there is any table with 'support' in name
  const allSupportTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%support%';
  `);
  console.log('Tables matching %support%:', allSupportTables.rows.map(r => r.table_name));

  // Check plans table
  const plans = await client.query('SELECT id, name, type, price, is_active FROM plans');
  console.log('\nPlans:', plans.rows);

  await client.end();
}

checkCols().catch(console.error);

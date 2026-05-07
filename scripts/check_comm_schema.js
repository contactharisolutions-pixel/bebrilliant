const db = require('../db');
async function run() {
    // Check campaign_logs columns
    const r = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'campaign_logs'
        ORDER BY ordinal_position
    `);
    console.log('campaign_logs columns:');
    r.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    // Check message_templates columns
    const r2 = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'message_templates'
        ORDER BY ordinal_position
    `);
    console.log('\nmessage_templates columns:');
    r2.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    // Check campaigns columns
    const r3 = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns'
        ORDER BY ordinal_position
    `);
    console.log('\ncampaigns columns:');
    r3.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    // Check customer_groups columns
    const r4 = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'customer_groups'
        ORDER BY ordinal_position
    `);
    console.log('\ncustomer_groups columns:');
    r4.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });

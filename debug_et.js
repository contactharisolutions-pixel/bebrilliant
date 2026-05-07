const db = require('./db');
async function test() {
    const business_id = 'biz_blink_001';
    try {
        console.log("Testing Eye Test KPIs SQL...");
        const [today, month, uniquePatients] = await Promise.all([
            db.query(`SELECT COUNT(*) FROM eye_test WHERE business_id = $1 AND test_date::date = CURRENT_DATE`, [business_id]),
            db.query(`SELECT COUNT(*) FROM eye_test WHERE business_id = $1 AND test_date >= CURRENT_DATE - INTERVAL '30 days'`, [business_id]),
            db.query(`SELECT COUNT(DISTINCT customer_id) FROM eye_test WHERE business_id = $1`, [business_id])
        ]);
        console.log("SUCCESS:", { today: today.rows[0].count, month: month.rows[0].count });
    } catch (e) {
        console.error("SQL ERROR:", e.message);
    }
    process.exit();
}
test();

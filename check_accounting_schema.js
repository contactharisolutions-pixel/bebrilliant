const db = require('./db');

async function check() {
    const expenses = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses'");
    const payments = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'payments'");
    const accounts = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts'");
    const journal_entries = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'journal_entries'");

    console.log('Expenses:', expenses.rows.map(r => r.column_name));
    console.log('Payments:', payments.rows.map(r => r.column_name));
    console.log('Accounts:', accounts.rows.map(r => r.column_name));
    console.log('Journal Entries:', journal_entries.rows.map(r => r.column_name));
    process.exit();
}
check();

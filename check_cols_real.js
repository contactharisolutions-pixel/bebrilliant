const db = require('./db');
db.query("SELECT * FROM product LIMIT 1").then(r => {
    console.log(r.fields.map(f => f.name));
    process.exit();
}).catch(e => {
    console.error(e);
    process.exit(1);
});

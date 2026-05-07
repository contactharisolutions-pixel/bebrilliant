const db = require('./db');
async function run() {
    try {
        await db.query(`UPDATE product SET product_name = COALESCE(NULLIF($1,''), product_name), short_description = COALESCE(NULLIF($2,''), short_description), description = COALESCE(NULLIF($3,''), description), seo_title = COALESCE(NULLIF($4,''), seo_title), seo_description = COALESCE(NULLIF($5,''), seo_description), tags = COALESCE($6, tags), measurement = COALESCE(NULLIF($7,''), measurement), lens_composite = COALESCE(NULLIF($8,''), lens_composite), lens_colorway = COALESCE(NULLIF($9,''), lens_colorway), gender_id = COALESCE($10, gender_id), shape_id = COALESCE($11, shape_id), material_id = COALESCE($12, material_id), main_image = COALESCE($13, main_image), is_published = true, active_status = true WHERE product_id=$14 AND business_id=$15`, ['','','','','', ['cool'], '','','',null,null,null,null,'foo','baz']);
        console.log('success');
    } catch(e) {
        console.error('SQL Error: ', e.message);
    }
    process.exit();
}
run();

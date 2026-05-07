
try {
    require('./middleware/roleGuards');
    console.log('middleware/roleGuards ok');
    require('./routes/public.routes');
    console.log('routes/public.routes ok');
    require('./routes/auth.routes');
    console.log('routes/auth.routes ok');
    require('./routes/storefront_account.routes.js');
    console.log('routes/storefront_account.routes.js ok');
    require('./routes/master.routes');
    console.log('routes/master.routes ok');
    require('./routes/media.routes');
    console.log('routes/media.routes ok');
    require('./routes/products.routes');
    console.log('routes/products.routes ok');
} catch (e) {
    console.error(e);
}

// middleware/roleGuards.js — Pre-wired guards for every route module
// Usage: app.use('/api/products', guards.products, require('./routes/products.routes'));
const auth = require('./auth');
const rbac = require('./rbac');

module.exports = {
    // Public
    public: [],

    // Products: Admin + Manager only for writes (read is public)
    products:  [auth],

    // Orders: All store roles
    orders:    [auth, rbac('Admin','Manager','Showroom Manager','Cashier','Sales')],

    // Inventory: Admin, Manager, Showroom Manager (view), Warehouse Staff
    inventory: [auth, rbac('Admin','Manager','Showroom Manager','Warehouse Staff','Sales')],

    // Customers: Everyone except Warehouse
    customers: [auth, rbac('Admin','Manager','Showroom Manager','Cashier','Optometrist','CRM Executive','Marketing','Sales')],

    // CRM: Admin, Manager, Showroom Manager, CRM Executive
    crm:       [auth, rbac('Admin','Manager','Showroom Manager','CRM Executive')],

    // Marketing + CMS: Admin + Marketing only
    marketing: [auth, rbac('Admin','Marketing')],

    // Reports: Admin, Manager, Showroom Manager (limited), Marketing
    reports:   [auth, rbac('Admin','Manager','Showroom Manager','Marketing')],

    // Staff/Settings: Admin only
    staff:     [auth, rbac('Admin')],
    showrooms: [auth, rbac('Admin','Manager','Showroom Manager','Sales')],

    // Clinic: Optometrist + above
    clinic:    [auth, rbac('Admin','Manager','Showroom Manager','Optometrist')],

    // Payment: All authenticated
    payment:   [auth],
    email:     [auth, rbac('Admin','Manager','Marketing')],
    accounting: [auth, rbac('Admin', 'Manager')],
    purchase:   [auth, rbac('Admin', 'Manager')],
};

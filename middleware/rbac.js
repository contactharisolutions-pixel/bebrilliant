// middleware/rbac.js — Role-Based Access Control Matrix
'use strict';

// Permission matrix per the enterprise workflow documentation
const ROLE_PERMISSIONS = {
    Admin:           ['dashboard','pos','products','ecommerce','inventory','orders','customers','crm','marketing','cms','reports','settings','staff','showrooms','clinic','transfers','business','master','media','appointments','accounting','purchase'],
    Manager:         ['dashboard','pos','products','ecommerce','inventory','orders','customers','crm','reports','showrooms','clinic','transfers','business','master','media','appointments','accounting','purchase'],
    'Showroom Manager': ['dashboard','pos','inventory_view','orders','customers','crm','reports_limited','clinic','appointments'],
    Cashier:         ['pos','orders','customers'],
    Optometrist:     ['clinic','customers','appointments'],
    'Warehouse Staff':  ['inventory','transfers'],
    'CRM Executive':    ['dashboard','customers','crm','appointments'],
    Marketing:       ['dashboard','marketing','cms','reports'],
    Sales:           ['pos','orders','customers','inventory_view'],
};

/**
 * Gate a route to specific roles.
 * Usage: router.get('/route', auth, rbac('Admin','Manager'), handler)
 */
module.exports = function rbac(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthenticated' });
        if (!allowedRoles.includes(req.user.role))
            return res.status(403).json({ success: false, error: `Access denied. Required: ${allowedRoles.join(' | ')}` });
        next();
    };
};

// Export the matrix so frontend can consume it via /api/auth/permissions
module.exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

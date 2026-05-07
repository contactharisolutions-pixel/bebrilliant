// middleware/auth.js — JWT Verification Middleware
const jwt = require('jsonwebtoken');

module.exports = async function authMiddleware(req, res, next) {
    // Accept token from cookie (web) or Authorization header (API clients / mobile)
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized — no token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`[Auth] Decoded ID: ${decoded.id}, Biz from Token: ${decoded.business_id}`);
        
        // Fallback for tokens missing business_id (e.g. from previous sessions)
        if (!decoded.business_id && decoded.id) {
            const db = require('../db');
            if (decoded.id.startsWith('usr_')) {
                const { rows } = await db.query('SELECT business_id, showroom_id FROM app_user WHERE user_id = $1', [decoded.id]);
                if (rows[0]) {
                    decoded.business_id = rows[0].business_id;
                    decoded.showroom_id = rows[0].showroom_id;
                    console.log(`[Auth Fallback] Fetched Biz: ${decoded.business_id}`);
                }
            } else if (decoded.id.startsWith('cust_')) {
                const { rows } = await db.query('SELECT business_id FROM customer WHERE customer_id = $1', [decoded.id]);
                if (rows[0]) {
                    decoded.business_id = rows[0].business_id;
                    console.log(`[Auth Fallback] Fetched Customer Biz: ${decoded.business_id}`);
                }
            }
        }

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Token invalid or expired' });
    }
};

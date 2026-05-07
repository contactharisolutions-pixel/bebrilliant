// routes/email.routes.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// POST /api/email/send
router.post('/send', auth, async (req, res) => {
    const { to, subject, html, text } = req.body;
    if (!to || !subject || !html)
        return res.status(400).json({ success: false, error: 'to, subject, and html are required' });

    try {
        const info = await transporter.sendMail({
            from: `"BlinkOpticals" <${process.env.SMTP_USER}>`,
            to, subject, html, text
        });
        res.json({ success: true, messageId: info.messageId });
    } catch (err) {
        console.error('[email error]', err.message);
        res.status(502).json({ success: false, error: 'Email delivery failed' });
    }
});

// POST /api/email/invoice — send order invoice email
router.post('/invoice', auth, async (req, res) => {
    const { to, customer_name, invoice_number, items, total_amount, payment_status } = req.body;
    const itemRows = (items || []).map(i =>
        `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>₹${i.unit_price}</td><td>₹${i.total_price}</td></tr>`
    ).join('');

    const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #eee">
      <h2 style="color:#000">BlinkOpticals Invoice</h2>
      <p>Dear ${customer_name}, thank you for your purchase!</p>
      <p><strong>Invoice #:</strong> ${invoice_number} &nbsp; <strong>Status:</strong> ${payment_status}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:20px">
        <thead>
          <tr style="background:#000;color:#fff">
            <th style="padding:10px;text-align:left">Product</th>
            <th>Qty</th><th>Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="margin-top:20px;font-size:1.2rem"><strong>Total: ₹${total_amount}</strong></p>
      <hr/>
      <p style="color:#999;font-size:0.8rem">Visit us at blinkopticals.com</p>
    </div>`;

    try {
        await transporter.sendMail({
            from: `"BlinkOpticals" <${process.env.SMTP_USER}>`,
            to, subject: `Invoice ${invoice_number} - BlinkOpticals`, html
        });
        res.json({ success: true });
    } catch (err) {
        res.status(502).json({ success: false, error: 'Invoice email failed' });
    }
});

module.exports = router;

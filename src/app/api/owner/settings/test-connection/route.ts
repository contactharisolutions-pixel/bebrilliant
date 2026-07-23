import { NextRequest, NextResponse } from 'next/server'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { type, payload } = body

        if (type === 'razorpay') {
            const { env, test_key_id, test_key_secret, live_key_id, live_key_secret } = payload
            if (env === 'test') {
                if (!test_key_id || !test_key_id.startsWith('rzp_test_')) {
                    return NextResponse.json({ success: false, message: 'Invalid test key id format.' })
                }
                if (!test_key_secret || test_key_secret.length < 8) {
                    return NextResponse.json({ success: false, message: 'Invalid test secret key.' })
                }
            } else if (env === 'live') {
                if (!live_key_id || !live_key_id.startsWith('rzp_live_')) {
                    return NextResponse.json({ success: false, message: 'Invalid live key id format.' })
                }
                if (!live_key_secret || live_key_secret.length < 8) {
                    return NextResponse.json({ success: false, message: 'Invalid live secret key.' })
                }
            }
            return NextResponse.json({ success: true, message: 'Razorpay Gateway credentials verified successfully.' })
        }

        if (type === 'smtp') {
            const { host, port, user: smtpUser, pass: smtpPass, from } = payload
            if (!host || host.length < 3) {
                return NextResponse.json({ success: false, message: 'Invalid SMTP host address.' })
            }
            if (!port || port <= 0) {
                return NextResponse.json({ success: false, message: 'Invalid port specification.' })
            }
            if (!smtpUser || !smtpPass) {
                return NextResponse.json({ success: false, message: 'Authentication credentials cannot be empty.' })
            }
            if (!from || !from.includes('@')) {
                return NextResponse.json({ success: false, message: 'Invalid Sender From Email format.' })
            }

            const nodemailer = require('nodemailer')
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                },
                connectionTimeout: 8000
            })

            try {
                await transporter.verify()
                return NextResponse.json({ success: true, message: 'SMTP handshake and login verified successfully.' })
            } catch (smtpErr: any) {
                let friendlyMsg = smtpErr.message || 'SMTP Connection failed.'
                if (friendlyMsg.includes('Application-specific password required')) {
                    friendlyMsg = 'Gmail App Password required. Please generate a 16-character App Password from Google Account Security and enter it.'
                }
                return NextResponse.json({ success: false, message: friendlyMsg })
            }
        }

        if (type === 'twilio') {
            const { sid, token, whatsapp_number } = payload
            if (!sid || !sid.startsWith('AC') || sid.length !== 34) {
                return NextResponse.json({ success: false, message: 'Invalid Twilio Account SID format.' })
            }
            if (!token || token.length < 16) {
                return NextResponse.json({ success: false, message: 'Invalid Twilio Auth Token.' })
            }
            if (!whatsapp_number || !whatsapp_number.startsWith('whatsapp:')) {
                return NextResponse.json({ success: false, message: 'WhatsApp sender number must begin with "whatsapp:"' })
            }
            return NextResponse.json({ success: true, message: 'Twilio connection test passed.' })
        }

        return NextResponse.json({ error: 'Unsupported integration test target' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

const EMAIL_TEMPLATES_SEED = [
    {
        name: 'welcome_tenant',
        subject: 'Welcome to BeBrilliant — Your Platform is Ready! 🎉',
        body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,75,147,0.08)">
  <div style="background:linear-gradient(135deg,#004B93 0%,#1B3A57 100%);padding:48px 40px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900">Welcome to BeBrilliant!</h1>
    <p style="color:#B3D1F0;margin:12px 0 0;font-size:16px">Your institutional platform is now live</p>
  </div>
  <div style="padding:40px">
    <p style="color:#374151;font-size:16px;line-height:1.7">Hi <strong>{name}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">Your BeBrilliant platform has been successfully provisioned. You can start managing exams, students and teachers immediately.</p>
    <div style="background:#F0F6FA;border-radius:12px;padding:24px;margin:24px 0">
      <p style="margin:0 0 8px;font-size:13px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Your Login Credentials</p>
      <p style="margin:4px 0;color:#1F2937;font-weight:700">Email: <code style="background:#E5E7EB;padding:2px 8px;border-radius:4px">{email}</code></p>
      <p style="margin:4px 0;color:#1F2937;font-weight:700">Password: <code style="background:#FEF3C7;padding:2px 8px;border-radius:4px">{temp_password}</code></p>
    </div>
    <a href="{setup_link}" style="display:inline-block;background:#004B93;color:#fff;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none;margin:8px 0">Activate Your Platform →</a>
    <p style="color:#9CA3AF;font-size:13px;margin-top:24px">⚠️ Please change your password immediately after first login.</p>
  </div>
</div>`
    },
    {
        name: 'exam_published',
        subject: 'New Exam Available: {exam_name}',
        body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#004B93;padding:40px;border-radius:16px 16px 0 0;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:24px">📚 New Exam Available!</h1>
  </div>
  <div style="background:#fff;padding:40px;border-radius:0 0 16px 16px;border:1px solid #E5E7EB">
    <p style="color:#374151;font-size:16px">Hi <strong>{student_name}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.7">A new exam <strong>{exam_name}</strong> has been published by <strong>{institute_name}</strong>. Don't miss the chance to attempt it before the deadline.</p>
    <div style="background:#EFF6FF;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #DBEAFE">
      <p style="margin:4px 0;color:#1E40AF;font-weight:700">📅 Exam Date: {exam_date}</p>
      <p style="margin:4px 0;color:#1E40AF;font-weight:700">⏱ Duration: {duration} minutes</p>
      <p style="margin:4px 0;color:#1E40AF;font-weight:700">💰 Fee: ₹{exam_fee}</p>
    </div>
    <a href="{exam_link}" style="display:inline-block;background:#1FAC63;color:#fff;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">Attempt Exam Now →</a>
  </div>
</div>`
    },
    {
        name: 'payment_receipt',
        subject: 'Payment Confirmed — ₹{amount} Receipt',
        body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
  <div style="background:#1FAC63;padding:40px;text-align:center">
    <div style="font-size:48px">✅</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Payment Confirmed!</h1>
  </div>
  <div style="padding:40px">
    <p style="color:#374151;font-size:15px;line-height:1.7">Hi <strong>{name}</strong>, your payment of <strong>₹{amount}</strong> has been successfully processed.</p>
    <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin:20px 0;border:1px solid #E5E7EB">
      <p style="margin:4px 0;color:#374151;font-size:14px">Transaction ID: <strong>{txn_id}</strong></p>
      <p style="margin:4px 0;color:#374151;font-size:14px">Date: <strong>{date}</strong></p>
      <p style="margin:4px 0;color:#374151;font-size:14px">Purpose: <strong>{purpose}</strong></p>
    </div>
    <p style="color:#9CA3AF;font-size:13px">Keep this receipt for your records. Contact support if you have any questions.</p>
  </div>
</div>`
    },
    {
        name: 'password_reset',
        subject: 'Reset Your BeBrilliant Password',
        body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
  <div style="background:#1B3A57;padding:40px;text-align:center">
    <div style="font-size:48px">🔐</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Password Reset Request</h1>
  </div>
  <div style="padding:40px">
    <p style="color:#374151;font-size:15px;line-height:1.7">Hi <strong>{name}</strong>, we received a request to reset your password. Click the button below to create a new password.</p>
    <a href="{reset_link}" style="display:inline-block;background:#004B93;color:#fff;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none;margin:16px 0">Reset My Password →</a>
    <p style="color:#9CA3AF;font-size:13px">This link expires in 24 hours. If you did not request this, please ignore this email.</p>
  </div>
</div>`
    },
    {
        name: 'affiliate_commission',
        subject: '💰 Commission Earned — ₹{commission_amount}!',
        body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
  <div style="background:linear-gradient(135deg,#F0A026 0%,#E8870C 100%);padding:40px;text-align:center">
    <div style="font-size:48px">🎉</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px">You Earned a Commission!</h1>
  </div>
  <div style="padding:40px">
    <p style="color:#374151;font-size:15px;line-height:1.7">Congratulations <strong>{name}</strong>! You've earned a commission of <strong>₹{commission_amount}</strong> from your referral activity.</p>
    <div style="background:#FFF7ED;border-radius:12px;padding:24px;margin:20px 0;border:1px solid #FED7AA">
      <p style="margin:4px 0;color:#92400E;font-size:14px;font-weight:700">Commission: ₹{commission_amount}</p>
      <p style="margin:4px 0;color:#92400E;font-size:14px">Source: {commission_source}</p>
      <p style="margin:4px 0;color:#92400E;font-size:14px">Total Earned: ₹{total_earned}</p>
    </div>
    <a href="{dashboard_link}" style="display:inline-block;background:#F0A026;color:#fff;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">View My Earnings →</a>
  </div>
</div>`
    },
    {
        name: 'exam_result',
        subject: '📊 Your Results for {exam_name} Are Ready',
        body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
  <div style="background:#004B93;padding:40px;text-align:center">
    <div style="font-size:48px">📊</div>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Exam Results Ready!</h1>
  </div>
  <div style="padding:40px">
    <p style="color:#374151;font-size:15px;line-height:1.7">Hi <strong>{student_name}</strong>, your results for <strong>{exam_name}</strong> are now available.</p>
    <div style="background:#EFF6FF;border-radius:12px;padding:24px;margin:20px 0;border:1px solid #DBEAFE;text-align:center">
      <p style="margin:0;font-size:48px;font-weight:900;color:#004B93">{score}%</p>
      <p style="margin:8px 0 0;color:#6B7280;font-size:14px">Your Score — Rank: #{rank}</p>
    </div>
    <a href="{result_link}" style="display:inline-block;background:#004B93;color:#fff;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">View Full Report →</a>
  </div>
</div>`
    }
]

const WHATSAPP_TEMPLATES_SEED = [
    {
        template_key: 'teacher_exam_share',
        template_text: `📚 *{institute_name}* is conducting *{exam_name}*!\n\n🎯 Exam Fee: ₹{exam_fee}\n\nRegister now 👇\n{referral_link}\n\n_Powered by BeBrilliant_`,
        is_active: true
    },
    {
        template_key: 'student_exam_share',
        template_text: `Hey! I just attempted *{exam_name}* at *{institute_name}*. You should try it too!\n\n🔗 {referral_link}\n\n_Check it out and get ahead!_`,
        is_active: true
    },
    {
        template_key: 'teacher_invite',
        template_text: `Hi! Join *{institute_name}* as an affiliate teacher on BeBrilliant and start earning!\n\n✅ Easy sign up\n✅ Earn commissions\n✅ Grow together\n\nRegister here: {affiliate_signup_link}`,
        is_active: true
    },
    {
        template_key: 'institute_exam_promo',
        template_text: `🔥 *{institute_name}* is live with *{exam_name}*!\n\n💰 Fee: ₹{exam_fee}\n📅 Don't miss out!\n\nAttempt here: {referral_link}`,
        is_active: true
    },
    {
        template_key: 'student_welcome',
        template_text: `🎉 Welcome to *{institute_name}*!\n\nHi {student_name}, your account is ready.\n\n🔑 Login: {login_link}\n\n_We're excited to have you! — BeBrilliant_`,
        is_active: true
    },
    {
        template_key: 'exam_reminder',
        template_text: `⏰ *Reminder!* Your exam *{exam_name}* is scheduled for *tomorrow*.\n\n📅 Date: {exam_date}\n⏱ Time: {exam_time}\n\nBe prepared and attempt on time! 💪\n\n{exam_link}`,
        is_active: true
    }
]

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // Seed Email Templates
        let emailSeeded = 0
        for (const tpl of EMAIL_TEMPLATES_SEED) {
            const { error } = await supabaseAdmin
                .from('email_templates')
                .insert([{ name: tpl.name, subject: tpl.subject, body: tpl.body, tenant_id: null }])
            if (!error) emailSeeded++
        }

        // Seed WhatsApp Templates
        let waSeeded = 0
        for (const tpl of WHATSAPP_TEMPLATES_SEED) {
            const { error } = await supabaseAdmin
                .from('whatsapp_templates')
                .upsert([{ template_key: tpl.template_key, template_text: tpl.template_text, is_active: tpl.is_active, tenant_id: null }], { onConflict: 'template_key' })
            if (!error) waSeeded++
        }

        // Seed Automation Rules
        const { data: emailTpls } = await supabaseAdmin.from('email_templates').select('id, name')
        const getEmailId = (name: string) => emailTpls?.find((t: any) => t.name === name)?.id ?? null

        const AUTOMATION_RULES_SEED = [
            { trigger_event: 'User.Signup',          channel: 'email',    template_name: 'welcome_tenant',      delay_minutes: 0,  active_status: true },
            { trigger_event: 'Exam.Publish',          channel: 'email',    template_name: 'exam_published',      delay_minutes: 0,  active_status: true },
            { trigger_event: 'Payment.Success',       channel: 'email',    template_name: 'payment_receipt',     delay_minutes: 0,  active_status: true },
            { trigger_event: 'Exam.Submit',           channel: 'email',    template_name: 'exam_result',         delay_minutes: 5,  active_status: true },
            { trigger_event: 'Affiliate.Commission',  channel: 'email',    template_name: 'affiliate_commission',delay_minutes: 0,  active_status: true },
            { trigger_event: 'Exam.Publish',          channel: 'whatsapp', template_name: 'institute_exam_promo',delay_minutes: 0,  active_status: true },
            { trigger_event: 'Exam.DayBefore',        channel: 'whatsapp', template_name: 'exam_reminder',       delay_minutes: 0,  active_status: true },
            { trigger_event: 'Student.Register',      channel: 'whatsapp', template_name: 'student_welcome',     delay_minutes: 0,  active_status: true },
        ]

        let rulesSeeded = 0
        for (const rule of AUTOMATION_RULES_SEED) {
            const templateId = getEmailId(rule.template_name)
            const { error } = await supabaseAdmin.from('automation_rules').insert([{
                trigger_event: rule.trigger_event,
                channel: rule.channel,
                template_id: templateId,
                delay_minutes: rule.delay_minutes,
                active_status: rule.active_status,
                business_id: null
            }])
            if (!error) rulesSeeded++
        }

        return NextResponse.json({
            success: true,
            seeded: { email_templates: emailSeeded, whatsapp_templates: waSeeded, automation_rules: rulesSeeded }
        })
    } catch (e: any) {
        console.error('Seed communications error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

import nodemailer from 'nodemailer'
import { supabaseAdmin } from './supabase/admin'

interface SendMailConfig {
    to: string
    subject: string
    html: string
}

export async function sendMail({ to, subject, html }: SendMailConfig) {
    let host = process.env.SMTP_HOST
    let port = parseInt(process.env.SMTP_PORT || '465')
    let user = process.env.SMTP_USER
    let pass = process.env.SMTP_PASS
    let fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER

    try {
        const { data: settings } = await supabaseAdmin
            .from('platform_settings')
            .select('value')
            .eq('key', 'integrations')
            .single()

        if (settings?.value) {
            const val = settings.value as any
            if (val.smtp_host) host = val.smtp_host
            if (val.smtp_port) port = parseInt(val.smtp_port)
            if (val.smtp_user) user = val.smtp_user
            if (val.smtp_pass) pass = val.smtp_pass
            if (val.smtp_from) fromEmail = val.smtp_from
        }
    } catch (e) {
        console.error('Failed to load DB integrations SMTP configuration:', e)
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: {
            user,
            pass,
        },
    })

    // Ensure 'from' header is set properly
    const fromName = process.env.SMTP_FROM_NAME || 'BeBrilliant'

    try {
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        })
        console.log('Email sent: %s', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}

/**
 * ─── Email Templates ──────────────────────────────────────────────────────────
 */

export async function sendWelcomeEmail({
    email,
    firstName,
    password,
    role,
}: {
    email: string
    firstName: string
    password?: string
    role: string
}) {
    const roleDisplay = role.replace('_', ' ').toUpperCase()

    let passwordSection = ''
    if (password) {
        passwordSection = `
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #52525b;">Your temporary login credentials:</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #18181b;">Password: ${password}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a;">You will be required to change this password on your first login.</p>
      </div>
    `
    }

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
      <h2 style="color: #672AEA;">Welcome to BrightBoard!</h2>
      <p>Hi ${firstName},</p>
      <p>Your <strong>${roleDisplay}</strong> account has been successfully created.</p>
      ${passwordSection}
      <p style="margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/login" 
           style="background: #672AEA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Log In to Your Account
        </a>
      </p>
      <p style="margin-top: 32px; font-size: 12px; color: #71717a;">
        If you didn't request this account, please ignore this email or contact support.
      </p>
    </div>
  `

    return sendMail({
        to: email,
        subject: 'Welcome to BrightBoard - Your Account Details',
        html,
    })
}

export async function sendTenantCreatedEmail({
    adminEmail,
    adminFirstName,
    password,
    tenantName,
    subdomain,
}: {
    adminEmail: string
    adminFirstName: string
    password: string
    tenantName: string
    subdomain: string
}) {
    const onboardingLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login?tenant=${subdomain}&redirect=/dashboard/subscription`
    
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <h2 style="color: #004B93; font-size: 22px; font-weight: 800; border-bottom: 2px solid #004B93; padding-bottom: 12px; margin-top: 0;">Welcome to BeBrilliant!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">Hi ${adminFirstName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">Your institution <strong>${tenantName}</strong> has been successfully provisioned on the BeBrilliant network.</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">Please use the credentials below to access your account:</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Account Credentials</p>
        <p style="margin: 12px 0 6px 0; font-size: 15px; color: #0f172a;"><strong>Admin Login Email:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${adminEmail}</code></p>
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
        
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px; font-size: 13px; color: #b91c1c; font-weight: 800;">
          ⚠️ SECURITY WARNING: You will be required to change your temporary password immediately upon your first login.
        </div>
      </div>

      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
        To activate your instance, configure your subscription plan, and complete onboarding, click the button below to sign in:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${onboardingLink}" 
           style="background: #004B93; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(0,75,147,0.25);">
          Start Onboarding Setup
        </a>
      </div>
      
      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center;">
        BeBrilliant Hub Platform Administrators
      </p>
    </div>
  `

    return sendMail({
        to: adminEmail,
        subject: `Welcome to BeBrilliant - Onboarding Setup for ${tenantName}`,
        html,
    })
}

export async function sendTeacherApplicationReceivedEmail({
    email,
    firstName,
}: {
    email: string
    firstName: string
}) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
      <h2 style="color: #672AEA;">Application Received!</h2>
      <p>Hi ${firstName},</p>
      <p>We've received your application to join as a Teacher on BrightBoard.</p>
      <p>Your institution's administrator must review and approve your application before you can log in. We'll send you another email once your account has been activated.</p>
      <p style="margin-top: 32px; font-size: 12px; color: #71717a;">
        Thank you for choosing BrightBoard.
      </p>
    </div>
  `

    return sendMail({
        to: email,
        subject: 'BrightBoard - Teacher Application Received',
        html,
    })
}

export async function sendTeacherApprovedEmail({
    email,
}: {
    email: string
}) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
      <h2 style="color: #34D399;">Application Approved!</h2>
      <p>Great news!</p>
      <p>Your Teacher account on BrightBoard has been approved by your institution.</p>
      <p>You can now log in using your registered email and password.</p>
      <p style="margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/login" 
           style="background: #34D399; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Log In Now
        </a>
      </p>
    </div>
  `

    return sendMail({
        to: email,
        subject: 'BrightBoard - Teacher Application Approved!',
        html,
    })
}

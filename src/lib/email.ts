import nodemailer from 'nodemailer'

interface SendMailConfig {
    to: string
    subject: string
    html: string
}

async function sendMail({ to, subject, html }: SendMailConfig) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    // Ensure 'from' header is set properly
    const fromName = process.env.SMTP_FROM_NAME || 'BrightBoard'
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER

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
}: {
    adminEmail: string
    adminFirstName: string
    password: string
    tenantName: string
}) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
      <h2 style="color: #672AEA;">Your Institution is Live on BrightBoard!</h2>
      <p>Hi ${adminFirstName},</p>
      <p>Your institution/organization <strong>${tenantName}</strong> has been successfully registered on BrightBoard.</p>
      <p>Your Tenant Admin account has been provisioned. Please use the credentials below to log in and configure your institution:</p>
      
      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #52525b;">Admin Credentials:</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #18181b;">Email: ${adminEmail}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #18181b;">Temporary Password: ${password}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a;">You will be required to change this password on your first login.</p>
      </div>

      <p style="margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/login" 
           style="background: #672AEA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Go to Admin Portal
        </a>
      </p>
    </div>
  `

    return sendMail({
        to: adminEmail,
        subject: `Welcome to BrightBoard - ${tenantName} Admin Access`,
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

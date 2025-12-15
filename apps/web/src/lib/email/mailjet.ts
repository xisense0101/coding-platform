import Mailjet from 'node-mailjet'
import { logger } from '@/lib/utils/logger'

// Initialize Mailjet client
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY || '',
  process.env.MAILJET_API_SECRET || ''
)

export interface SendCredentialsEmailParams {
  to: string
  fullName: string
  email: string
  password: string
  role: string
  organizationName: string
}

export async function sendCredentialsEmail({
  to,
  fullName,
  email,
  password,
  role,
  organizationName
}: SendCredentialsEmailParams) {
  try {
    // Get sender information from environment variables
    const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com'
    const fromName = process.env.FROM_NAME || organizationName
    
    logger.info(`Attempting to send email to ${to} from ${fromEmail}`)
    
    const request = mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: fromName
            },
            To: [
              {
                Email: to,
                Name: fullName
              }
            ],
            Subject: `Welcome to ${organizationName} - Your Account Credentials`,
            HTMLPart: getCredentialsEmailTemplate({
              fullName,
              email,
              password,
              role,
              organizationName
            })
          }
        ]
      })

    const result = await request
    
    if (result.body) {
      const responseBody = result.body as any
      const messageInfo = responseBody.Messages?.[0]
      logger.info(`Credentials email sent successfully to ${to}`, { 
        messageId: messageInfo?.To?.[0]?.MessageID,
        status: messageInfo?.Status 
      })
      return { success: true, data: result.body }
    }

    return { success: false, error: 'No response from Mailjet' }
  } catch (error: any) {
    logger.error('Error sending email via Mailjet:', { 
      error: error.message || error, 
      statusCode: error.statusCode,
      to, 
      from: process.env.FROM_EMAIL 
    })
    return { success: false, error }
  }
}

function getCredentialsEmailTemplate({
  fullName,
  email,
  password,
  role,
  organizationName
}: Omit<SendCredentialsEmailParams, 'to'>) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${organizationName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #4F46E5;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px 0;
    }
    .credentials-box {
      background-color: #F3F4F6;
      border-left: 4px solid #4F46E5;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .credentials-box strong {
      color: #4F46E5;
    }
    .password-box {
      background-color: #FEF3C7;
      border: 2px solid #F59E0B;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .password-display {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      color: #D97706;
      background-color: #FFFBEB;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      margin: 10px 0;
      word-break: break-all;
    }
    .warning {
      background-color: #FEE2E2;
      border-left: 4px solid #EF4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-title {
      color: #DC2626;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #4338CA;
    }
    .steps {
      background-color: #EFF6FF;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      color: #6B7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Welcome to ${organizationName}</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${fullName}</strong>,</p>
      
      <p>Your account has been created successfully! You have been registered as a <strong>${roleDisplay}</strong> on our platform.</p>
      
      <div class="credentials-box">
        <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
      </div>

      <div class="password-box">
        <p style="margin: 0 0 5px 0; color: #D97706; font-weight: bold;">⚠️ Your Temporary Password:</p>
        <div class="password-display">${password}</div>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #92400E;">
          <strong>Important:</strong> Save this password now. You won't be able to see it again!
        </p>
      </div>

      <div class="warning">
        <div class="warning-title">🔒 Security Notice</div>
        <p style="margin: 5px 0; font-size: 14px;">
          This is a temporary password. For your security, you <strong>must change it</strong> after your first login.
        </p>
      </div>

      <div class="steps">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #1E40AF;">📝 Next Steps:</p>
        <ol>
          <li>Click the button below to access the login page</li>
          <li>Enter your email and temporary password</li>
          <li>You will be prompted to change your password immediately</li>
          <li>Choose a strong, unique password for your account</li>
        </ol>
      </div>

      <div style="text-align: center;">
        <a href="${loginUrl}/login" class="button">Login to Your Account</a>
      </div>

      <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
        If you have any questions or need assistance, please contact your administrator or our support team.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from ${organizationName}.</p>
      <p style="font-size: 12px; margin-top: 10px;">
        If you didn't expect this email, please contact your administrator immediately.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendBulkCredentialsEmails(
  users: SendCredentialsEmailParams[]
): Promise<{ success: number; failed: number; errors: Array<{ email: string; error: any }> }> {
  let success = 0
  let failed = 0
  const errors: Array<{ email: string; error: any }> = []

  for (const user of users) {
    const result = await sendCredentialsEmail(user)
    if (result.success) {
      success++
    } else {
      failed++
      errors.push({ email: user.to, error: result.error })
    }
    // Small delay to avoid rate limiting (Mailjet free tier: 200 emails/day, 6000/month)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success, failed, errors }
}

export interface SendContactEmailParams {
  name: string
  email: string
  subject: string
  message: string
}

// mailjet
export async function sendContactEmail({
  name,
  email,
  subject,
  message
}: SendContactEmailParams) {
  try {
    // The email address where you want to receive the contact form submissions
    const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.FROM_EMAIL || 'support@yourdomain.com'
    
    // The sender must be a verified sender in Mailjet (e.g. no-reply@blockscode.me)
    const fromEmail = process.env.FROM_EMAIL || 'no-reply@blockscode.me'
    
    logger.info(`Sending contact form email from ${email} to ${adminEmail}`)
    
    const request = mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: "Contact Form System"
            },
            To: [
              {
                Email: adminEmail,
                Name: "Admin"
              }
            ],
            ReplyTo: {
              Email: email,
              Name: name
            },
            Subject: `[Contact Form] ${subject}`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                <p>You have received a new message from your website contact form.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Subject:</strong> ${subject}</p>
                <br />
                <p><strong>Message:</strong></p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
                  ${message.replace(/\n/g, '<br />')}
                </div>
              </div>
            `,
            TextPart: `
              New Contact Form Submission
              
              Name: ${name}
              Email: ${email}
              Subject: ${subject}
              
              Message:
              ${message}
            `
          }
        ]
      })

    const result = await request
    logger.info(`Contact email sent successfully`)
    return { success: true, data: result.body }
  } catch (error) {
    logger.error('Failed to send contact email:', error)
    return { success: false, error }
  }
}

/**
 * email-templates.ts — HTML email templates for Vytl notifications.
 *
 * All templates return plain HTML strings (no React Email dependency).
 * Design: white background, teal (#0d9488) accent, system fonts, CTA button.
 */

const TEAL = '#0d9488'
const DARK_TEXT = '#1e293b'
const MUTED_TEXT = '#64748b'
const BORDER = '#e2e8f0'
const BG = '#f8fafc'

function baseLayout(content: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vytl Notification</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${TEAL};padding:24px 32px;border-radius:8px 8px 0 0;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Vytl</span>
            <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px;">Risk Management</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid ${BORDER};border-top:none;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;text-align:center;border:1px solid ${BORDER};border-top:none;border-radius:0 0 8px 8px;background:#ffffff;">
            <p style="margin:0;font-size:12px;color:${MUTED_TEXT};">
              Vytl — Risk Management for South African Businesses<br/>
              <a href="${appUrl}/settings" style="color:${TEAL};text-decoration:none;">Manage notification preferences</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;margin-top:24px;">${label}</a>`
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;background:${color}20;color:${color};border:1px solid ${color}40;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;">${text}</span>`
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function appetiteBreachEmail(data: {
  orgName: string
  recipientName: string
  riskTitle: string
  refCode: string
  residualScore: number
  band: 'HIGH' | 'EXTREME'
  appUrl: string
}): string {
  const bandColor = data.band === 'EXTREME' ? '#dc2626' : '#ea580c'
  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">Risk Appetite Alert — ${data.orgName}</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">Risk Appetite Breach Detected</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${DARK_TEXT};">Hi ${data.recipientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      A risk has exceeded your organisation's appetite threshold and requires attention.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${BORDER};border-radius:6px;padding:16px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:12px;color:${MUTED_TEXT};text-transform:uppercase;letter-spacing:0.5px;">Risk</p>
        <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:${DARK_TEXT};">${data.refCode}: ${data.riskTitle}</p>
        <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">Residual Score</p>
        <p style="margin:0 0 12px;">
          <span style="font-size:24px;font-weight:700;color:${bandColor};">${data.residualScore}</span>
          <span style="margin-left:8px;">${badge(data.band, bandColor)}</span>
        </p>
      </td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:${MUTED_TEXT};">
      Review this risk and update your treatment plan or accept the elevated exposure.
    </p>
    ${ctaButton('View Risk', `${data.appUrl}/risks`)}
  `
  return baseLayout(content, data.appUrl)
}

export function kriRedAlertEmail(data: {
  orgName: string
  recipientName: string
  kriName: string
  riskTitle?: string
  refCode?: string
  appUrl: string
}): string {
  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">KRI Alert — ${data.orgName}</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">KRI Status: Red</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${DARK_TEXT};">Hi ${data.recipientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      A Key Risk Indicator has moved to <strong style="color:#dc2626;">Red</strong> status and requires immediate review.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${BORDER};border-radius:6px;padding:16px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">KRI</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:${DARK_TEXT};">${data.kriName}</p>
        ${data.refCode ? `
        <p style="margin:8px 0 4px;font-size:12px;color:${MUTED_TEXT};">Related Risk</p>
        <p style="margin:0;font-size:14px;color:${DARK_TEXT};">${data.refCode}: ${data.riskTitle}</p>` : ''}
      </td></tr>
    </table>
    ${ctaButton('Review KRI', `${data.appUrl}/kris`)}
  `
  return baseLayout(content, data.appUrl)
}

export function riskAssignedEmail(data: {
  orgName: string
  recipientName: string
  riskTitle: string
  refCode: string
  assignerName: string
  appUrl: string
}): string {
  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">${data.orgName}</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">Risk Assigned to You</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${DARK_TEXT};">Hi ${data.recipientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      <strong>${data.assignerName}</strong> has assigned you as the owner of the following risk.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${BORDER};border-radius:6px;padding:16px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">Risk</p>
        <p style="margin:0;font-size:16px;font-weight:600;color:${DARK_TEXT};">${data.refCode}: ${data.riskTitle}</p>
      </td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:${MUTED_TEXT};">
      As risk owner, you are responsible for maintaining the treatment plan and keeping the risk register up to date.
    </p>
    ${ctaButton('View Risk', `${data.appUrl}/risks`)}
  `
  return baseLayout(content, data.appUrl)
}

export function incidentCreatedEmail(data: {
  orgName: string
  recipientName: string
  incidentTitle: string
  severity: string
  riskTitle: string
  refCode: string
  appUrl: string
}): string {
  const severityColor =
    data.severity === 'CRITICAL' ? '#dc2626' :
    data.severity === 'HIGH'     ? '#ea580c' :
    data.severity === 'MEDIUM'   ? '#d97706' : '#64748b'

  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">Incident Alert — ${data.orgName}</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">New Incident Reported</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${DARK_TEXT};">Hi ${data.recipientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      A new incident has been linked to a risk you own.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${BORDER};border-radius:6px;padding:16px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">Incident</p>
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${DARK_TEXT};">${data.incidentTitle}</p>
        <p style="margin:0 0 12px;">${badge(data.severity, severityColor)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">Related Risk</p>
        <p style="margin:0;font-size:14px;color:${DARK_TEXT};">${data.refCode}: ${data.riskTitle}</p>
      </td></tr>
    </table>
    ${ctaButton('View Risk', `${data.appUrl}/risks`)}
  `
  return baseLayout(content, data.appUrl)
}

export function inviteUserEmail(data: {
  orgName: string
  inviterName: string
  inviteUrl: string
  appUrl: string
}): string {
  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">You&rsquo;ve been invited to Vytl</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">Join ${data.orgName} on Vytl</h1>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      <strong>${data.inviterName}</strong> has invited you to collaborate on risk management in Vytl.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:${MUTED_TEXT};">
      Click the button below to set up your account. This invitation link expires in 7 days.
    </p>
    ${ctaButton('Accept Invitation', data.inviteUrl)}
    <p style="margin:24px 0 0;font-size:12px;color:${MUTED_TEXT};">
      If you weren&rsquo;t expecting this invitation, you can safely ignore this email.
    </p>
  `
  return baseLayout(content, data.appUrl)
}

export function passwordResetEmail(data: {
  recipientName: string | null
  resetUrl: string
  appUrl: string
}): string {
  const name = data.recipientName ?? 'there'
  const content = `
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">Reset your password</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${DARK_TEXT};">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      We received a request to reset your Vytl password. Click the button below to choose a new password.
      This link expires in 1 hour.
    </p>
    ${ctaButton('Reset Password', data.resetUrl)}
    <p style="margin:24px 0 0;font-size:13px;color:${MUTED_TEXT};">
      If you did not request a password reset, please ignore this email — your password will not be changed.
    </p>
  `
  return baseLayout(content, data.appUrl)
}

export function welcomeEmail(data: {
  recipientName: string
  orgName: string
  appUrl: string
}): string {
  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">Welcome to Vytl</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">Your account is ready</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${DARK_TEXT};">Hi ${data.recipientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};line-height:1.6;">
      Welcome to <strong>Vytl</strong> — AI-powered risk management built for South African businesses.
      Your organisation <strong>${data.orgName}</strong> is now set up and ready to go.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${BORDER};border-radius:6px;padding:20px;margin-bottom:24px;">
      <tr><td>
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${DARK_TEXT};">Get started in 3 easy steps:</p>
        <p style="margin:0 0 8px;font-size:14px;color:${DARK_TEXT};">
          <span style="display:inline-block;width:22px;height:22px;background:${TEAL};color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;">1</span>
          Choose an industry template to pre-populate your risk register
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:${DARK_TEXT};">
          <span style="display:inline-block;width:22px;height:22px;background:${TEAL};color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;">2</span>
          Customise risks to match your specific business context
        </p>
        <p style="margin:0;font-size:14px;color:${DARK_TEXT};">
          <span style="display:inline-block;width:22px;height:22px;background:${TEAL};color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;">3</span>
          Generate your first board-ready risk report
        </p>
      </td></tr>
    </table>
    ${ctaButton('Get Started', `${data.appUrl}/onboarding`)}
  `
  return baseLayout(content, data.appUrl)
}

export function verifyEmailTemplate({ recipientName, verifyUrl, appUrl }: {
  recipientName: string
  verifyUrl: string
  appUrl: string
}): string {
  return baseLayout(`
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${DARK_TEXT};">Verify your email address</h1>
      <p style="margin:0 0 24px;color:${MUTED_TEXT};line-height:1.6;">Hi ${recipientName}, thanks for signing up for Vytl! Please verify your email address to activate your account.</p>
      <table cellpadding="0" cellspacing="0"><tr><td style="background:#0d9488;border-radius:8px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;">Verify my email address</a>
      </td></tr></table>
      <p style="margin:24px 0 0;color:${MUTED_TEXT};font-size:13px;">This link expires in 24 hours. If you didn't create a Vytl account, you can safely ignore this email.</p>
      <p style="margin:12px 0 0;color:${MUTED_TEXT};font-size:13px;">Or copy this link: <a href="${verifyUrl}" style="color:#0d9488;">${verifyUrl}</a></p>
    </td></tr>
  `, appUrl)
}

export function weeklyDigestEmail(data: {
  orgName: string
  recipientName: string
  totalRisks: number
  highRisks: number
  extremeRisks: number
  openIncidents: number
  vytlScore: number | null
  vytlGrade: string | null
  appUrl: string
}): string {
  const scoreColor =
    (data.vytlScore ?? 0) >= 80 ? '#16a34a' :
    (data.vytlScore ?? 0) >= 60 ? TEAL :
    (data.vytlScore ?? 0) >= 40 ? '#d97706' : '#dc2626'

  const content = `
    <p style="margin:0 0 4px;font-size:13px;color:${MUTED_TEXT};">Weekly Risk Digest — ${data.orgName}</p>
    <h1 style="margin:0 0 24px;font-size:20px;color:${DARK_TEXT};font-weight:700;">Your Weekly Risk Summary</h1>
    <p style="margin:0 0 20px;font-size:15px;color:${DARK_TEXT};">Hi ${data.recipientName},</p>
    <table width="100%" cellpadding="16" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="background:${BG};border:1px solid ${BORDER};border-radius:6px;text-align:center;padding:20px;">
          <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">VYTL SCORE</p>
          <p style="margin:0;font-size:32px;font-weight:700;color:${scoreColor};">
            ${data.vytlScore ?? '—'}${data.vytlGrade ? `<span style="font-size:16px;margin-left:6px;">(${data.vytlGrade})</span>` : ''}
          </p>
        </td>
        <td width="16"></td>
        <td style="background:${BG};border:1px solid ${BORDER};border-radius:6px;text-align:center;padding:20px;">
          <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">TOTAL RISKS</p>
          <p style="margin:0;font-size:32px;font-weight:700;color:${DARK_TEXT};">${data.totalRisks}</p>
        </td>
        <td width="16"></td>
        <td style="background:${BG};border:1px solid ${BORDER};border-radius:6px;text-align:center;padding:20px;">
          <p style="margin:0 0 4px;font-size:12px;color:${MUTED_TEXT};">HIGH / EXTREME</p>
          <p style="margin:0;font-size:32px;font-weight:700;color:#dc2626;">${data.highRisks + data.extremeRisks}</p>
        </td>
      </tr>
    </table>
    ${data.openIncidents > 0 ? `
    <p style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:14px;color:#991b1b;">
      <strong>${data.openIncidents} open incident${data.openIncidents > 1 ? 's' : ''}</strong> require${data.openIncidents === 1 ? 's' : ''} attention.
    </p>` : ''}
    ${ctaButton('Open Dashboard', `${data.appUrl}/dashboard`)}
  `
  return baseLayout(content, data.appUrl)
}

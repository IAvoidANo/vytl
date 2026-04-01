/**
 * email.ts — Thin wrapper around Resend for transactional email.
 *
 * Falls back to console logging when RESEND_API_KEY is not set,
 * so the app works in dev/test without email configured.
 */

import { Resend } from 'resend'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? 'VytlRx <avin@hbdadvisory.com>'

export async function sendEmail(opts: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const resend = getResend()

  if (!resend) {
    // Dev mode — log and succeed silently
    console.log('[Email dev-mode]', opts.subject, '->', opts.to)
    return { success: true }
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    })
    return { success: true }
  } catch (err) {
    console.error('[Email error]', err)
    return { success: false, error: String(err) }
  }
}

import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export const FROM_EMAIL = 'Northern Warrior <noreply@northernwarrior.co.uk>'
export const REPLY_TO = 'info@northernwarrior.co.uk'

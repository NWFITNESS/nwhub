import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  // Validate Twilio signature to prevent spoofed requests
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    return new NextResponse('Server misconfigured', { status: 500 })
  }

  const signature = req.headers.get('x-twilio-signature') ?? ''
  const url = req.nextUrl.href

  // Twilio signs the URL + sorted form params — read once and reuse
  const formData = await req.formData()
  const params: Record<string, string> = {}
  formData.forEach((value, key) => {
    params[key] = String(value)
  })

  const valid = twilio.validateRequest(authToken, signature, url, params)
  if (!valid) {
    return new NextResponse('Invalid signature', { status: 403 })
  }

  const from = (params.From as string | undefined) ?? null
  const body = (params.Body as string | undefined) ?? null

  if (from && body && body.trim().toUpperCase().includes('STOP')) {
    const phone = from.replace(/^whatsapp:/, '')
    const supabase = createAdminClient()
    await supabase
      .from('review_requests')
      .update({ opted_out: true })
      .eq('phone_number', phone)
  }


  // Return empty TwiML response
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const from = formData.get('From') as string | null
  const body = formData.get('Body') as string | null

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

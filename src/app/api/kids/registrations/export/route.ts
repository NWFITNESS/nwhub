import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getAllRegistrations } from '@/lib/kids/queries'
import { buildRegistrationsCsv } from '@/lib/kids/registrations'

// CSV export of every Kids & Teens block registration — includes parent and
// emergency contact phone numbers. Auth-guarded (exposes personal data).
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const regs = await getAllRegistrations()
  const csv = buildRegistrationsCsv(regs)
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kids-teens-registrations-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

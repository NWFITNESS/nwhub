import { NextResponse } from 'next/server'

export async function GET() {
  const csv = [
    'first_name,last_name,email,phone,groups,notes',
    'John,Smith,john@example.com,+447700000000,members;vip,Example note',
    'Jane,Doe,jane@example.com,07911123456,members,',
  ].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="contacts-template.csv"',
    },
  })
}

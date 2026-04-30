import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffPermissions } from '@/lib/staff'
import { DEFAULT_STAFF_PERMISSIONS, FULL_PERMISSIONS } from '@/lib/staff'

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin.from('staff_profiles').select('*').eq('user_id', user.id).single()
  return data
}

/**
 * GET /api/staff — List all staff profiles
 */
export async function GET() {
  const supabase = await createClient()
  const caller = await getCallerProfile(supabase)
  if (!caller || !['owner', 'admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: staff, error } = await admin
    .from('staff_profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff })
}

/**
 * POST /api/staff — Invite a new staff member
 * Body: { email, display_name, role, permissions? }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const caller = await getCallerProfile(supabase)
  if (!caller || !['owner', 'admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, display_name, role, permissions } = body as {
    email: string
    display_name: string
    role: string
    permissions?: Partial<StaffPermissions>
  }

  if (!email || !display_name) {
    return NextResponse.json({ error: 'Email and display name are required' }, { status: 400 })
  }

  // Admins can only create staff, not other admins
  if (caller.role === 'admin' && role !== 'staff') {
    return NextResponse.json({ error: 'Admins can only invite staff members' }, { status: 403 })
  }

  // Only owners can create admins
  if (role === 'owner') {
    return NextResponse.json({ error: 'Cannot create another owner' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Check if email already exists
  const { data: existing } = await admin.from('staff_profiles').select('id').eq('email', email).single()
  if (existing) {
    return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 409 })
  }

  // Create Supabase auth user with a random password (they'll need to reset)
  const tempPassword = crypto.randomUUID() + '!Aa1'
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { display_name },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Determine permissions
  const finalPermissions: StaffPermissions = role === 'admin'
    ? FULL_PERMISSIONS
    : { ...DEFAULT_STAFF_PERMISSIONS, ...(permissions ?? {}) }

  // Create staff profile
  const { error: profileError } = await admin.from('staff_profiles').insert({
    user_id: authData.user.id,
    display_name,
    email,
    role: role || 'staff',
    permissions: finalPermissions,
    status: 'invited',
    invited_by: caller.user_id,
  })

  if (profileError) {
    // Clean up auth user if profile creation fails
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Send password reset email so they can set their own password
  const { error: resetError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (resetError) {
    console.error('[staff] Failed to send invite email:', resetError.message)
  }

  return NextResponse.json({ success: true })
}

/**
 * PATCH /api/staff — Update a staff member
 * Body: { id, display_name?, role?, permissions?, status? }
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const caller = await getCallerProfile(supabase)
  if (!caller || !['owner', 'admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...updates } = body as {
    id: string
    display_name?: string
    role?: string
    permissions?: StaffPermissions
    status?: string
  }

  if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })

  const admin = createAdminClient()

  // Get target staff member
  const { data: target } = await admin.from('staff_profiles').select('*').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })

  // Permission checks
  if (target.role === 'owner' && caller.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can modify owner accounts' }, { status: 403 })
  }
  if (target.role === 'admin' && caller.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can modify admin accounts' }, { status: 403 })
  }
  if (updates.role === 'owner') {
    return NextResponse.json({ error: 'Cannot promote to owner' }, { status: 403 })
  }

  const { error } = await admin.from('staff_profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/staff — Remove a staff member
 * Query: ?id=...
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const caller = await getCallerProfile(supabase)
  if (!caller || caller.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can remove staff' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })

  const admin = createAdminClient()

  // Get staff member
  const { data: target } = await admin.from('staff_profiles').select('*').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 })
  }

  // Delete auth user (cascades to staff_profiles)
  const { error: authError } = await admin.auth.admin.deleteUser(target.user_id)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

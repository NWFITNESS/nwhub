'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Panel } from '@/components/ui/Card'
import { PageStatCard } from '@/components/ui/PageStatCard'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  Users, UserPlus, Shield, ShieldCheck, UserCog,
  MoreVertical, Trash2, Ban, CheckCircle2, X,
  Search,
} from 'lucide-react'
import type { StaffProfile, StaffPermissions } from '@/lib/staff'
import {
  ROLE_LABELS, ROLE_COLOURS,
  PERMISSION_LABELS, PERMISSION_DESCRIPTIONS,
  DEFAULT_STAFF_PERMISSIONS, FULL_PERMISSIONS,
} from '@/lib/staff'

interface Props {
  callerRole: 'owner' | 'admin'
}

export function StaffPageClient({ callerRole }: Props) {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffProfile | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  async function fetchStaff() {
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      setStaff(data.staff ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  // Stats
  const totalUsers = staff.length
  const activeCount = staff.filter(s => s.status === 'active').length
  const adminCount = staff.filter(s => s.role === 'owner' || s.role === 'admin').length
  const staffCount = staff.filter(s => s.role === 'staff').length

  // Filter
  const filtered = staff.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.display_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  async function handleStatusChange(id: string, status: string) {
    await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setActionMenuId(null)
    fetchStaff()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this staff member? This will delete their account and cannot be undone.')) return
    await fetch(`/api/staff?id=${id}`, { method: 'DELETE' })
    setActionMenuId(null)
    fetchStaff()
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Administration"
        title="Staff Management"
        actions={
          <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Staff
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PageStatCard label="Total Users" value={totalUsers} sub="All staff accounts" icon={<Users size={14} className="text-nw-200" />} />
        <PageStatCard label="Active" value={activeCount} sub="Currently active" color="#22c55e" icon={<CheckCircle2 size={14} className="text-green-400" />} />
        <PageStatCard label="Admins" value={adminCount} sub="Full access" color="#3b82f6" icon={<ShieldCheck size={14} className="text-blue-400" />} />
        <PageStatCard label="Staff" value={staffCount} sub="Limited access" gold icon={<UserCog size={14} className="text-gold-400" />} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nw-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full h-10 rounded-lg border border-white/10 bg-white/[0.04] text-sm text-nw-100 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)]"
          style={{ paddingLeft: 38, paddingRight: 14 }}
        />
      </div>

      {/* Staff table */}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {['User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-wider font-semibold text-nw-500" style={{ padding: '12px 16px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-nw-500 text-sm" style={{ padding: 40 }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-nw-500 text-sm" style={{ padding: 40 }}>No staff members found</td></tr>
              ) : (
                filtered.map(member => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden"
                          style={{
                            width: 36,
                            height: 36,
                            background: member.avatar_url ? undefined : `linear-gradient(135deg, ${
                              member.role === 'owner' ? '#967705, #c9a70a' :
                              member.role === 'admin' ? '#2563eb, #60a5fa' :
                              '#4b5563, #9ca3af'
                            })`,
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : member.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-nw-100">{member.display_name}</p>
                          <p className="text-[11px] text-nw-500">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md text-[11px] font-semibold"
                        style={{
                          padding: '3px 10px',
                          background: ROLE_COLOURS[member.role]?.bg,
                          color: ROLE_COLOURS[member.role]?.text,
                          border: `1px solid ${ROLE_COLOURS[member.role]?.border}`,
                        }}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                        member.status === 'active' ? 'text-green-400' :
                        member.status === 'invited' ? 'text-blue-400' :
                        'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'active' ? 'bg-green-400' :
                          member.status === 'invited' ? 'bg-blue-400' :
                          'bg-red-400'
                        }`} />
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>

                    {/* Last login */}
                    <td className="text-[12px] text-nw-400" style={{ padding: '12px 16px' }}>
                      {member.last_login_at
                        ? new Date(member.last_login_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : 'Never'
                      }
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-1">
                        {/* Edit permissions button */}
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => setEditTarget(member)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-nw-500 hover:text-nw-200 hover:bg-white/[0.05] transition-colors"
                            title="Edit permissions"
                          >
                            <Shield size={15} />
                          </button>
                        )}

                        {/* More actions */}
                        {member.role !== 'owner' && (
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuId(actionMenuId === member.id ? null : member.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-nw-500 hover:text-nw-200 hover:bg-white/[0.05] transition-colors"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {actionMenuId === member.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-[180px] rounded-lg border border-white/10 bg-nw-750 shadow-xl overflow-hidden">
                                {member.status === 'active' ? (
                                  <button
                                    onClick={() => handleStatusChange(member.id, 'suspended')}
                                    className="flex w-full items-center gap-2.5 text-[12px] text-nw-300 hover:bg-white/[0.05] transition-colors"
                                    style={{ padding: '10px 14px' }}
                                  >
                                    <Ban size={14} className="text-orange-400" />
                                    Suspend Access
                                  </button>
                                ) : member.status === 'suspended' ? (
                                  <button
                                    onClick={() => handleStatusChange(member.id, 'active')}
                                    className="flex w-full items-center gap-2.5 text-[12px] text-nw-300 hover:bg-white/[0.05] transition-colors"
                                    style={{ padding: '10px 14px' }}
                                  >
                                    <CheckCircle2 size={14} className="text-green-400" />
                                    Reactivate
                                  </button>
                                ) : null}
                                {callerRole === 'owner' && (
                                  <button
                                    onClick={() => handleDelete(member.id)}
                                    className="flex w-full items-center gap-2.5 text-[12px] text-red-400 hover:bg-red-500/8 transition-colors"
                                    style={{ padding: '10px 14px' }}
                                  >
                                    <Trash2 size={14} />
                                    Remove User
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Invite modal */}
      <InviteModal
        open={inviteOpen}
        callerRole={callerRole}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => { setInviteOpen(false); fetchStaff() }}
      />

      {/* Edit permissions modal */}
      <EditPermissionsModal
        open={!!editTarget}
        callerRole={callerRole}
        staff={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => { setEditTarget(null); fetchStaff() }}
      />
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ open, callerRole, onClose, onSuccess }: {
  open: boolean
  callerRole: 'owner' | 'admin'
  onClose: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<string>('staff')
  const [permissions, setPermissions] = useState<StaffPermissions>({ ...DEFAULT_STAFF_PERMISSIONS })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        display_name: displayName,
        role,
        permissions: role === 'admin' ? FULL_PERMISSIONS : permissions,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Failed to invite staff member')
      return
    }
    onSuccess()
  }

  function togglePerm(key: keyof StaffPermissions) {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Staff Member" width="lg">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4" style={{ padding: '0 0 20px' }}>
          <Field label="Full name">
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              required
            />
          </Field>

          <Field label="Email address">
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="sarah@northernwarrior.co.uk"
              required
            />
          </Field>

          <Field label="Role">
            <div className="flex gap-2">
              {(['staff', ...(callerRole === 'owner' ? ['admin'] : [])] as string[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg text-[13px] font-medium border transition-all ${
                    role === r
                      ? 'bg-[rgba(212,160,23,0.1)] text-gold-400 border-[rgba(212,160,23,0.25)]'
                      : 'bg-white/[0.03] text-nw-400 border-white/8 hover:border-white/15'
                  }`}
                  style={{ padding: '10px 14px' }}
                >
                  {ROLE_LABELS[r]}
                  <span className="block text-[10px] mt-0.5 opacity-60">
                    {r === 'admin' ? 'Full access' : 'Custom access'}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {/* Permissions grid (only for staff role) */}
          {role === 'staff' && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-nw-500 mb-3">Permissions</p>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(PERMISSION_LABELS) as (keyof StaffPermissions)[]).map(key => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                      permissions[key] ? 'bg-[rgba(212,160,23,0.06)]' : 'hover:bg-white/[0.02]'
                    }`}
                    style={{ padding: '8px 12px' }}
                  >
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={() => togglePerm(key)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      permissions[key]
                        ? 'bg-gold-500 border-gold-500'
                        : 'border-white/20 bg-transparent'
                    }`}>
                      {permissions[key] && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#000" strokeWidth="2">
                          <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-nw-200">{PERMISSION_LABELS[key]}</p>
                      <p className="text-[10px] text-nw-500 leading-tight">{PERMISSION_DESCRIPTIONS[key]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg" style={{ padding: '10px 14px' }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/8" style={{ paddingTop: 16 }}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit Permissions Modal ────────────────────────────────────────────────────

function EditPermissionsModal({ open, callerRole, staff, onClose, onSuccess }: {
  open: boolean
  callerRole: 'owner' | 'admin'
  staff: StaffProfile | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [role, setRole] = useState(staff?.role ?? 'staff')
  const [permissions, setPermissions] = useState<StaffPermissions>({ ...(staff?.permissions ?? DEFAULT_STAFF_PERMISSIONS) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    setSaving(true)

    const res = await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: staff?.id,
        role,
        permissions: role === 'admin' ? FULL_PERMISSIONS : permissions,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error || 'Failed to update')
      return
    }
    onSuccess()
  }

  function togglePerm(key: keyof StaffPermissions) {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function selectAll() {
    setPermissions({ ...FULL_PERMISSIONS })
  }

  function selectNone() {
    const empty = { ...FULL_PERMISSIONS }
    for (const k of Object.keys(empty)) (empty as Record<string, boolean>)[k] = false
    setPermissions(empty as StaffPermissions)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Access — ${staff?.display_name ?? ''}`} width="lg">
      <div className="flex flex-col gap-4" style={{ padding: '0 0 20px' }}>
        {/* Role selector */}
        {callerRole === 'owner' && (
          <Field label="Role">
            <div className="flex gap-2">
              {['staff', 'admin'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r as 'staff' | 'admin')}
                  className={`flex-1 rounded-lg text-[13px] font-medium border transition-all ${
                    role === r
                      ? 'bg-[rgba(212,160,23,0.1)] text-gold-400 border-[rgba(212,160,23,0.25)]'
                      : 'bg-white/[0.03] text-nw-400 border-white/8 hover:border-white/15'
                  }`}
                  style={{ padding: '10px 14px' }}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Permissions */}
        {role === 'staff' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-nw-500">Permissions</p>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] text-gold-400 hover:underline">Select all</button>
                <button onClick={selectNone} className="text-[10px] text-nw-500 hover:underline">Clear all</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 max-h-[400px] overflow-y-auto">
              {(Object.keys(PERMISSION_LABELS) as (keyof StaffPermissions)[]).map(key => (
                <label
                  key={key}
                  className={`flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                    permissions[key] ? 'bg-[rgba(212,160,23,0.06)]' : 'hover:bg-white/[0.02]'
                  }`}
                  style={{ padding: '8px 12px' }}
                >
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={() => togglePerm(key)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    permissions[key]
                      ? 'bg-gold-500 border-gold-500'
                      : 'border-white/20 bg-transparent'
                  }`}>
                    {permissions[key] && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#000" strokeWidth="2">
                        <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-nw-200">{PERMISSION_LABELS[key]}</p>
                    <p className="text-[10px] text-nw-500 leading-tight">{PERMISSION_DESCRIPTIONS[key]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {role === 'admin' && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5" style={{ padding: '14px 16px' }}>
            <p className="text-[12px] text-blue-400 font-medium">Admins have full access to all features.</p>
            <p className="text-[10px] text-blue-400/60 mt-1">Change role to Staff for granular permission control.</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg" style={{ padding: '10px 14px' }}>
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-white/8" style={{ paddingTop: 16 }}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </Modal>
  )
}

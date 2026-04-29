'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Eye, EyeOff, KeyRound, Mail, LogOut, ShieldAlert, Fingerprint, Trash2, Plus } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' }
  if (score === 2) return { score: 2, label: 'Fair', color: '#f97316' }
  if (score === 3) return { score: 3, label: 'Good', color: '#eab308' }
  return { score: 4, label: 'Strong', color: '#22c55e' }
}

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-nw-750 border border-white/8 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-white/50" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-white/40 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Passkey Manager ─────────────────────────────────────────────────────────

interface PasskeyRecord {
  id: string
  label: string
  device_type: string | null
  backed_up: boolean
  created_at: string
  last_used_at: string | null
}

function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/passkey')
      .then(r => r.json())
      .then(d => setPasskeys(d.passkeys ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleRegister() {
    setRegistering(true)
    setMessage(null)
    try {
      const optionsRes = await fetch('/api/passkey/register')
      const options = await optionsRes.json()
      if (optionsRes.status !== 200) throw new Error(options.error ?? 'Failed to get options')

      const regResp = await startRegistration({ optionsJSON: options })

      const verifyRes = await fetch('/api/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), response: regResp }),
      })
      const result = await verifyRes.json()
      if (result.verified) {
        setMessage({ type: 'success', text: 'Passkey registered! You\'ll need it to sign in from now on.' })
        setLabel('')
        // Refetch passkeys
        const res = await fetch('/api/passkey')
        const data = await res.json()
        setPasskeys(data.passkeys ?? [])
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Registration failed' })
      }
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes('cancelled') || msg.includes('abort')) {
        setMessage({ type: 'error', text: 'Passkey setup was cancelled.' })
      } else {
        setMessage({ type: 'error', text: msg || 'Failed to register passkey' })
      }
    }
    setRegistering(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this passkey? You\'ll need to set up a new one if you want passkey login.')) return
    await fetch(`/api/passkey?id=${id}`, { method: 'DELETE' })
    setPasskeys(prev => prev.filter(p => p.id !== id))
    setMessage({ type: 'success', text: 'Passkey removed.' })
  }

  return (
    <SectionCard icon={Fingerprint} title="Passkeys" description="Use fingerprint, face scan, or a security key instead of a password.">
      <div className="max-w-sm">
        {loading ? (
          <p className="text-white/40 text-xs">Loading…</p>
        ) : (
          <>
            {passkeys.length > 0 && (
              <div className="mb-4 space-y-2">
                {passkeys.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03]" style={{ padding: '10px 14px' }}>
                    <div>
                      <p className="text-white text-sm font-medium">{p.label || 'Passkey'}</p>
                      <p className="text-white/40 text-[11px]">
                        Added {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {p.last_used_at && ` · Last used ${new Date(p.last_used_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="text-white/20 hover:text-red-400 transition-colors" title="Remove passkey">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <Field label="Label (optional)">
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. iPhone, MacBook, YubiKey"
                />
              </Field>

              {message && (
                <p className={`text-sm px-3 py-2 rounded-lg border ${
                  message.type === 'success'
                    ? 'text-green-400 bg-green-400/10 border-green-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'
                }`}>
                  {message.text}
                </p>
              )}

              <Button variant="primary" size="sm" loading={registering} onClick={handleRegister}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                {passkeys.length > 0 ? 'Add another passkey' : 'Set up passkey'}
              </Button>

              {passkeys.length === 0 && (
                <p className="text-white/30 text-xs">
                  No passkeys registered. Once set up, you&apos;ll need your passkey every time you sign in — phishing-resistant and faster.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </SectionCard>
  )
}

// ── Main Settings Component ─────────────────────────────────────────────────

export function AccountSecuritySettings() {
  const router = useRouter()
  const supabase = createClient()

  // ── Change password ──────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMessage(null)
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) {
      setPwMessage({ type: 'error', text: error.message })
    } else {
      setPwMessage({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const strength = getStrength(newPassword)

  // ── Change email ─────────────────────────────────────
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailMessage(null)
    setEmailLoading(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    setEmailLoading(false)
    if (error) {
      setEmailMessage({ type: 'error', text: error.message })
    } else {
      setEmailMessage({ type: 'success', text: `Confirmation email sent to ${newEmail}. Check your inbox.` })
      setNewEmail('')
    }
  }

  // ── Sign out all sessions ────────────────────────────
  const [sessionsLoading, setSessionsLoading] = useState(false)

  async function handleSignOutAll() {
    setSessionsLoading(true)
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/login')
  }

  // ── Sign out ─────────────────────────────────────────
  const [signOutLoading, setSignOutLoading] = useState(false)

  async function handleSignOut() {
    setSignOutLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Change Password */}
      <SectionCard icon={KeyRound} title="Change Password" description="Update your account password.">
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <Field label="New password">
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ backgroundColor: strength.score >= seg ? strength.color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <Field label="Confirm new password">
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
              )}
            </Field>
          </div>

          {pwMessage && (
            <p className={`text-sm px-3 py-2 rounded-lg border ${
              pwMessage.type === 'success'
                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                : 'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {pwMessage.text}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={pwLoading}
            disabled={!!confirmPassword && newPassword !== confirmPassword}
          >
            Update password
          </Button>
        </form>
      </SectionCard>

      {/* Change Email */}
      <SectionCard icon={Mail} title="Change Email" description="Update the email address for your admin account.">
        <form onSubmit={handleChangeEmail} className="space-y-4 max-w-sm">
          <Field label="New email address">
            <Input
              type="email"
              placeholder="new@northernwarrior.co.uk"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          {emailMessage && (
            <p className={`text-sm px-3 py-2 rounded-lg border ${
              emailMessage.type === 'success'
                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                : 'text-red-400 bg-red-400/10 border-red-400/20'
            }`}>
              {emailMessage.text}
            </p>
          )}

          <Button type="submit" variant="primary" size="sm" loading={emailLoading}>
            Update email
          </Button>
        </form>
      </SectionCard>

      {/* Passkeys */}
      <PasskeyManager />

      {/* Sessions */}
      <SectionCard icon={LogOut} title="Sessions" description="Sign out of all active sessions across all devices.">
        <Button
          variant="secondary"
          size="sm"
          loading={sessionsLoading}
          onClick={handleSignOutAll}
        >
          Sign out all sessions
        </Button>
      </SectionCard>

      {/* Danger Zone */}
      <div className="bg-nw-750 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Sign Out</h3>
            <p className="text-white/40 text-xs mt-0.5">End your current session and return to the login page.</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          loading={signOutLoading}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}

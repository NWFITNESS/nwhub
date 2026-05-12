'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { NWHubIcon } from '@/components/NWHubIcon'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { Eye, EyeOff, CheckCircle2, Lock, ShieldAlert, Fingerprint } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 30
const STORAGE_KEY = 'nwhub_login_attempts'

function getAttemptData(): { count: number; lockUntil: number } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, lockUntil: 0 }
    return JSON.parse(raw)
  } catch {
    return { count: 0, lockUntil: 0 }
  }
}

function setAttemptData(data: { count: number; lockUntil: number }) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const [passkeyStep, setPasskeyStep] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyError, setPasskeyError] = useState('')
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  const resetSuccess = searchParams.get('reset') === 'success'
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const data = getAttemptData()
    const now = Math.floor(Date.now() / 1000)
    if (data.lockUntil > now) {
      setLockoutRemaining(data.lockUntil - now)
    }
  }, [])

  useEffect(() => {
    if (lockoutRemaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lockoutRemaining])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const data = getAttemptData()
    const now = Math.floor(Date.now() / 1000)

    if (data.lockUntil > now) {
      setLockoutRemaining(data.lockUntil - now)
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      const newCount = data.count + 1
      if (newCount >= MAX_ATTEMPTS) {
        const lockUntil = now + LOCKOUT_SECONDS
        setAttemptData({ count: newCount, lockUntil })
        setLockoutRemaining(LOCKOUT_SECONDS)
        setError('')
      } else {
        setAttemptData({ count: newCount, lockUntil: 0 })
        const remaining = MAX_ATTEMPTS - newCount
        setError(
          remaining === 1
            ? 'Invalid email or password. 1 attempt remaining before lockout.'
            : `Invalid email or password. ${remaining} attempts remaining.`
        )
      }
    } else {
      setAttemptData({ count: 0, lockUntil: 0 })
      // Check if user has a passkey registered — if so, require verification
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          const res = await fetch(`/api/passkey/authenticate?user_id=${user.id}`)
          const json = await res.json()
          if (json.hasPasskey) {
            setPendingUserId(user.id)
            setPasskeyStep(true)
            // Auto-trigger the passkey prompt
            handlePasskeyAuth(user.id, json.options)
            return
          }
        } catch {
          // If passkey check fails, let them through (don't block login)
        }
      }
      router.push('/')
      router.refresh()
    }
  }

  async function handlePasskeyAuth(userId: string, options: unknown) {
    setPasskeyLoading(true)
    setPasskeyError('')
    try {
      const authResp = await startAuthentication({ optionsJSON: options as Parameters<typeof startAuthentication>[0]['optionsJSON'] })
      const verifyRes = await fetch('/api/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, response: authResp }),
      })
      const result = await verifyRes.json()
      if (result.verified) {
        router.push('/')
        router.refresh()
      } else {
        setPasskeyError(result.error ?? 'Passkey verification failed')
      }
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes('cancelled') || msg.includes('abort')) {
        setPasskeyError('Passkey verification cancelled. Try again or sign out.')
      } else {
        setPasskeyError('Passkey verification failed. Try again.')
      }
    }
    setPasskeyLoading(false)
  }

  async function handleRetryPasskey() {
    if (!pendingUserId) return
    try {
      const res = await fetch(`/api/passkey/authenticate?user_id=${pendingUserId}`)
      const json = await res.json()
      if (json.hasPasskey) {
        handlePasskeyAuth(pendingUserId, json.options)
      }
    } catch {
      setPasskeyError('Failed to start passkey verification')
    }
  }

  async function handleDirectPasskeyLogin() {
    setPasskeyLoading(true)
    setError('')
    try {
      // Get discoverable authentication options (no user_id)
      const optionsRes = await fetch('/api/passkey/authenticate')
      const json = await optionsRes.json()
      if (!json.hasPasskey) {
        setError('No passkeys found. Register one in Settings → Account Security first.')
        setPasskeyLoading(false)
        return
      }

      const authResp = await startAuthentication({ optionsJSON: json.options })
      const verifyRes = await fetch('/api/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResp }),
      })
      const result = await verifyRes.json()
      if (result.verified && result.session_token) {
        // Discoverable flow — create a Supabase session using the token
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: result.session_token,
          type: 'magiclink',
        })
        if (otpError) {
          setError('Session creation failed. Try email and password.')
          setPasskeyLoading(false)
          return
        }
        router.push('/')
        router.refresh()
      } else if (result.verified) {
        router.push('/')
        router.refresh()
      } else {
        setError(result.error ?? 'Passkey verification failed')
      }
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes('cancelled') || msg.includes('abort')) {
        // User cancelled — do nothing
      } else if (msg.includes('No credentials') || msg.includes('not registered') || msg.includes('no passkey')) {
        setError('No passkey found for this device. Register one in Settings → Account Security, then try again.')
      } else {
        setError('Passkey login failed. Try email and password instead.')
      }
    }
    setPasskeyLoading(false)
  }

  async function handleSignOutFromPasskey() {
    await supabase.auth.signOut()
    setPasskeyStep(false)
    setPendingUserId(null)
    setPasskeyError('')
  }

  const isLocked = lockoutRemaining > 0

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">

      {/* ── Video background ─────────────────────────────────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/compass-loop.mp4"
      />

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      {/* Primary dark veil */}
      <div className="absolute inset-0 bg-black/65" />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* ── Centred content ──────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[400px] px-4 py-10 flex flex-col items-center">

        {/* App icon */}
        <div className="relative flex-shrink-0" style={{ marginBottom: '14mm' }}>
          <NWHubIcon size={88} className="drop-shadow-2xl" />
        </div>

        {/* Brand name */}
        <div className="text-center mb-8 select-none">
          <h1
            className="text-[#c9a70a] font-bold text-2xl tracking-widest uppercase leading-none"
            style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
          >
            Northern Warrior
          </h1>
          <p className="text-[#d0c5af]/45 text-[11px] uppercase tracking-[0.3em] mt-1.5 font-medium">
            Hub — Admin Panel
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: '#111110',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.05) inset',
          }}
        >
          {/* Card header */}
          <div style={{ padding: '28px 28px 0' }}>
            <h2
              className="text-lg font-bold text-white mb-0.5"
              style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
            >
              Sign in to your account
            </h2>
            <p className="text-white/40 text-[13px]">Welcome back to NWHub</p>
          </div>

          <div style={{ padding: '20px 28px 28px' }}>
            {/* Reset success banner */}
            {resetSuccess && (
              <div className="flex items-center gap-3 mb-5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm" style={{ padding: '10px 14px' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Password reset successfully. Please sign in.
              </div>
            )}

            {/* Passkey verification step */}
            {passkeyStep ? (
              <div className="text-center" style={{ padding: '12px 0' }}>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                >
                  <Fingerprint className="w-8 h-8 text-[#c9a70a]" />
                </div>
                <p className="text-white font-semibold text-lg mb-1">Verify your identity</p>
                <p className="text-white/40 text-sm mb-6">
                  Use your fingerprint, face scan, or security key.
                </p>

                {passkeyError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg mb-4" style={{ padding: '10px 14px' }}>
                    {passkeyError}
                  </p>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  loading={passkeyLoading}
                  onClick={handleRetryPasskey}
                  className="w-full"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  {passkeyLoading ? 'Waiting for passkey…' : 'Verify with passkey'}
                </Button>
                <button
                  type="button"
                  onClick={handleSignOutFromPasskey}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors mt-4"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : isLocked ? (
              <div className="text-center" style={{ padding: '12px 0' }}>
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-white font-semibold mb-1">Too many attempts</p>
                <p className="text-white/40 text-sm mb-5">Please wait before trying again.</p>
                <div className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20" style={{ padding: '10px 20px' }}>
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 font-mono text-sm font-semibold tabular-nums">
                    {String(Math.floor(lockoutRemaining / 60)).padStart(2, '0')}:
                    {String(lockoutRemaining % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Passkey button — primary action */}
                <button
                  type="button"
                  onClick={handleDirectPasskeyLogin}
                  disabled={passkeyLoading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{
                    padding: '12px 0',
                    background: 'linear-gradient(135deg, #967705, #c9a70a)',
                    color: '#000',
                  }}
                >
                  <Fingerprint className="w-[18px] h-[18px]" />
                  {passkeyLoading ? 'Waiting for passkey…' : 'Sign in with passkey'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3" style={{ margin: '20px 0' }}>
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-white/25 text-[10px] uppercase tracking-[0.2em]">or use email</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                {/* Email + password form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Email address</label>
                    <input
                      type="email"
                      placeholder="you@northernwarrior.co.uk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.04] text-white text-sm outline-none transition-colors focus:border-[#967705]/50 focus:bg-white/[0.06] placeholder:text-white/20"
                      style={{ padding: '10px 14px' }}
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] text-white text-sm outline-none transition-colors focus:border-[#967705]/50 focus:bg-white/[0.06] placeholder:text-white/20"
                        style={{ padding: '10px 14px', paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1.5">
                      <Link
                        href="/forgot-password"
                        className="text-xs text-white/30 hover:text-[#c9a70a] transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg" style={{ padding: '10px 14px' }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/12 disabled:opacity-50"
                    style={{
                      padding: '11px 0',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/15 mt-6 tracking-wide select-none">
          Northern Warrior Hub &mdash; Internal use only
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
      <PWAInstallPrompt />
    </Suspense>
  )
}

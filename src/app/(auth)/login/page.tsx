'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Eye, EyeOff, CheckCircle2, Lock, ShieldAlert } from 'lucide-react'

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

function Logo({ url, className = '' }: { url: string | null; className?: string }) {
  if (url) {
    return <img src={url} alt="Northern Warrior" className={`object-contain ${className}`} />
  }
  return (
    <div className={`bg-[#967705] flex items-center justify-center ${className}`}>
      <span className="text-black font-bold text-2xl tracking-widest">NW</span>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  const resetSuccess = searchParams.get('reset') === 'success'
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch logo from media library
  useEffect(() => {
    supabase.from('media').select('url').eq('category', 'logo').maybeSingle()
      .then(({ data }) => { if (data?.url) setLogoUrl(data.url) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for active lockout on mount
  useEffect(() => {
    const data = getAttemptData()
    const now = Math.floor(Date.now() / 1000)
    if (data.lockUntil > now) {
      setLockoutRemaining(data.lockUntil - now)
    }
  }, [])

  // Countdown timer
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
      router.push('/')
      router.refresh()
    }
  }

  const isLocked = lockoutRemaining > 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* ── Left panel — branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Decorative background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(150,119,5,0.12) 0%, transparent 70%)',
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(150,119,5,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(150,119,5,0.06) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Decorative diagonal lines */}
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-10"
          viewBox="0 0 400 800"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <line x1="400" y1="0" x2="0" y2="400" stroke="#c9a70a" strokeWidth="0.5" />
          <line x1="400" y1="100" x2="100" y2="400" stroke="#c9a70a" strokeWidth="0.5" />
          <line x1="400" y1="200" x2="200" y2="400" stroke="#c9a70a" strokeWidth="0.5" />
          <line x1="400" y1="300" x2="0" y2="700" stroke="#c9a70a" strokeWidth="0.5" />
          <line x1="400" y1="400" x2="0" y2="800" stroke="#c9a70a" strokeWidth="0.5" />
          <line x1="300" y1="0" x2="0" y2="300" stroke="#c9a70a" strokeWidth="0.5" />
          <line x1="200" y1="0" x2="0" y2="200" stroke="#c9a70a" strokeWidth="0.5" />
          <circle cx="200" cy="400" r="120" stroke="#c9a70a" strokeWidth="0.5" fill="none" />
          <circle cx="200" cy="400" r="200" stroke="#c9a70a" strokeWidth="0.3" fill="none" />
        </svg>

        {/* Logo */}
        <div className="relative">
          <Logo url={logoUrl} className="h-20 w-auto" />
        </div>

        {/* Centre content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#967705]/40 bg-[#967705]/10 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a70a] animate-pulse" />
            <span className="text-[#c9a70a] text-xs font-medium tracking-wide">Secure Admin Access</span>
          </div>
          <h1
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
          >
            Manage your
            <br />
            <span style={{ color: '#c9a70a' }}>gym operations</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-sm">
            Members, finances, communications and settings — all in one place. Built for Northern Warrior.
          </p>
        </div>

        {/* Bottom stat strip */}
        <div className="relative flex items-center gap-8">
          {[
            { label: 'Members', value: 'Live data' },
            { label: 'Xero sync', value: 'Automated' },
            { label: 'Security', value: 'End-to-end' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[#c9a70a] text-sm font-semibold">{item.value}</p>
              <p className="text-white/30 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Logo url={logoUrl} className="h-16 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          {/* Reset success banner */}
          {resetSuccess && (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Password reset successfully. Please sign in.
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
            <p className="text-white/40 text-sm">Sign in to your admin account</p>
          </div>

          {/* Lockout state */}
          {isLocked ? (
            <div className="bg-[#161616] border border-white/8 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-white font-semibold mb-1">Too many attempts</p>
              <p className="text-white/40 text-sm mb-4">Please wait before trying again.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-mono text-sm font-semibold tabular-nums">
                  {String(Math.floor(lockoutRemaining / 60)).padStart(2, '0')}:
                  {String(lockoutRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="you@northernwarrior.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </Field>

              <div>
                <Field label="Password">
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-white/35 hover:text-[#c9a70a] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
                Sign In
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-white/20 mt-8">
            Northern Warrior Hub &mdash; Internal use only
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

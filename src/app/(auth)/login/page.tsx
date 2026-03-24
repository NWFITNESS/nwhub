'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
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
      router.push('/')
      router.refresh()
    }
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
      {/* Gold radial warmth centred */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 48%, rgba(212,175,55,0.07) 0%, transparent 65%)',
        }}
      />
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
        <div className="relative mb-9 flex-shrink-0">
          {/* Gold halo behind icon */}
          <div
            className="absolute -inset-5 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)' }}
          />
          <Image
            src="/icons/NWHub-Icon.svg"
            alt="NWHub"
            width={88}
            height={88}
            className="relative drop-shadow-2xl"
            priority
          />
        </div>

        {/* Brand name */}
        <div className="text-center mb-8 select-none">
          <h1
            className="text-[#f2ca50] font-bold text-2xl tracking-widest uppercase leading-none"
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
          className="w-full rounded-2xl p-7 border"
          style={{
            background: 'rgba(13, 12, 10, 0.72)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderColor: 'rgba(212,175,55,0.14)',
            boxShadow:
              '0 0 0 1px rgba(212,175,55,0.06) inset, 0 32px 80px rgba(0,0,0,0.55), 0 0 60px rgba(212,175,55,0.04)',
          }}
        >
          {/* Reset success banner */}
          {resetSuccess && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Password reset successfully. Please sign in.
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h2
              className="text-xl font-bold text-[#e5e2e1] mb-1"
              style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
            >
              Welcome back
            </h2>
            <p className="text-[#d0c5af]/40 text-sm font-body">Sign in to your admin account</p>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-6 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }}
          />

          {/* Lockout state */}
          {isLocked ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-[#e5e2e1] font-semibold mb-1">Too many attempts</p>
              <p className="text-[#d0c5af]/40 text-sm mb-5 font-body">Please wait before trying again.</p>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d0c5af]/30 hover:text-[#d0c5af]/70 transition-colors"
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
                    className="text-xs text-[#d0c5af]/35 hover:text-[#f2ca50] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/8 border border-red-400/20 rounded-lg px-3 py-2.5">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-1"
              >
                Sign In
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/18 mt-6 tracking-wide select-none">
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

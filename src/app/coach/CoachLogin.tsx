'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function CoachLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/coach`,
      },
    })
    setBusy(false)
    if (error) {
      setErr("We couldn’t find that email. Ask the gym to add you as a coach, then try again.")
      return
    }
    setSent(true)
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '72px 24px', minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, letterSpacing: '3px', textTransform: 'uppercase', color: '#c9a70a', fontWeight: 700 }}>Northern Warrior</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>Coach Rota</h1>
        <p style={{ fontSize: 14, color: '#8296b4', marginTop: 8 }}>Sign in to add your availability and claim sessions.</p>
      </div>

      {sent ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', borderRadius: 16, border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.08)' }}>
          <Mail size={28} style={{ color: '#22c55e', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Check your email</p>
          <p style={{ fontSize: 13, color: '#8296b4', marginTop: 6 }}>We’ve sent a login link to <strong style={{ color: '#b9c6da' }}>{email}</strong>. Tap it on this phone to sign in.</p>
        </div>
      ) : (
        <form onSubmit={sendLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" required inputMode="email" autoComplete="email"
            placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '14px 16px', fontSize: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#edf3fb', width: '100%' }}
          />
          {err && <p style={{ fontSize: 13, color: '#f87171' }}>{err}</p>}
          <button type="submit" disabled={busy} style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 12, border: '1px solid rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.18)', color: '#f5d775', cursor: 'pointer' }}>
            {busy ? 'Sending…' : 'Send login link'}
          </button>
        </form>
      )}

      <p style={{ fontSize: 12, color: '#5e6e82', textAlign: 'center', marginTop: 24 }}>Tip: after signing in, add this page to your home screen.</p>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Always show success — never reveal if email exists (security best practice)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }).catch(() => {})
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(150,119,5,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(150,119,5,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#967705] flex items-center justify-center shadow-[0_0_20px_rgba(150,119,5,0.4)]">
            <span className="text-black font-bold text-sm tracking-wider">NW</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Northern Warrior</p>
            <p className="text-white/40 text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>

        <div className="bg-[#161616] border border-white/8 rounded-2xl p-8 shadow-2xl">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                If that email is registered, you&apos;ll receive a reset link shortly. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[#c9a70a] hover:text-[#e0bc0e] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-xl font-semibold text-white mb-1.5">Reset your password</h1>
                <p className="text-white/50 text-sm">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="Email address">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </Field>

                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                  Send reset link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

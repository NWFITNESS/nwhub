'use client'

import { useState } from 'react'
import {
  Sparkles, Copy, Download, RefreshCw,
  ChevronRight, Check, Eye, Code,
} from 'lucide-react'

const QUICK_PROMPTS = [
  'New class launching next month — get members excited and booking',
  'Google review request — warm and personal, include the review link',
  'Re-engagement — member hasn\'t been in for 2 weeks, friendly check-in',
  'Kids & Teens term starting — inform parents of dates and what to bring',
  'Special offer — 2 week free trial for referrals',
  'Monthly newsletter — community update, achievements, upcoming events',
  'Membership price change notice — transparent and reassuring',
  'Bank holiday opening hours — keep members informed',
]

const TONES = [
  { value: 'warm',         label: 'Warm & Personal' },
  { value: 'motivating',   label: 'Motivating & Energetic' },
  { value: 'direct',       label: 'Direct & Clear' },
  { value: 'professional', label: 'Professional' },
  { value: 'fun',          label: 'Fun & Casual' },
]

const AUDIENCES = [
  { value: 'all_members',  label: 'All Members' },
  { value: 'adult_members',label: 'Adult Members' },
  { value: 'kids_parents', label: 'Kids & Teens Parents' },
  { value: 'trials',       label: 'Trial Members' },
  { value: 'inactive',     label: 'Inactive Members' },
  { value: 'hyrox',        label: 'Hyrox Members' },
]

const GENERATING_STEPS = [
  'Applying Northern Warrior branding',
  'Writing copy based on your brief',
  'Building HTML structure',
  'Checking mobile responsiveness',
]

export function AIEmailCreatorClient() {
  const [prompt, setPrompt]         = useState('')
  const [tone, setTone]             = useState('warm')
  const [audience, setAudience]     = useState('all_members')
  const [generating, setGenerating] = useState(false)
  const [html, setHtml]             = useState('')
  const [error, setError]           = useState('')
  const [copied, setCopied]         = useState(false)
  const [activeTab, setActiveTab]   = useState<'preview' | 'html'>('preview')

  async function generate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setHtml('')
    setError('')

    try {
      const res = await fetch('/api/email-campaigns/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, audience }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setHtml(data.html)
      setActiveTab('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  function copyHTML() {
    navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadHTML() {
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'nw-email-campaign.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">EMAIL CAMPAIGNS</p>
        <h1 className="text-3xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>AI Email Creator</h1>
        <p className="text-sm text-white/40 mt-1">Describe your email — get a fully branded HTML template in seconds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT — Input panel ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Prompt */}
          <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-4">DESCRIBE YOUR EMAIL</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
              placeholder={`e.g. Announce our new Hyrox training programme starting in April. Target adult members. Include what Hyrox is, class times (Mon/Wed 6:30pm), and a CTA to book a free taster session...`}
              rows={6}
              className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors leading-relaxed"
            />
            <p className="text-xs text-white/20 mt-2">The more detail you give, the better the email. Press ⌘+Enter to generate.</p>
          </div>

          {/* Options */}
          <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-4">OPTIONS</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-[0.1em] mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
                >
                  {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-[0.1em] mb-1.5">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
                >
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-4">QUICK START</p>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(qp)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm text-white/50 bg-white/[0.02] border border-white/[0.05] hover:text-white hover:border-[#967705]/30 hover:bg-[#967705]/5 transition-all duration-200 group"
                >
                  <span>{qp}</span>
                  <ChevronRight size={13} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[#C9A70A] transition-opacity ml-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}
          <button
            onClick={generate}
            disabled={!prompt.trim() || generating}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(201,167,10,0.2)]"
          >
            {generating
              ? <><RefreshCw size={15} className="animate-spin" /> Generating your email...</>
              : <><Sparkles size={15} /> Generate Email</>
            }
          </button>
        </div>

        {/* ── RIGHT — Preview panel ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Tab bar + actions */}
          {html && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex bg-[#161616] border border-white/[0.06] rounded-lg p-1 gap-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'preview'
                      ? 'bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/30'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'html'
                      ? 'bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/30'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <Code size={12} /> HTML
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyHTML}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white/50 border border-white/[0.08] bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
                >
                  {copied ? <><Check size={12} className="text-green-400" /> Copied!</> : <><Copy size={12} /> Copy HTML</>}
                </button>
                <button
                  onClick={downloadHTML}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          )}

          {/* Output area */}
          <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '620px' }}>

            {/* Empty state */}
            {!html && !generating && (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 p-12">
                <div className="w-16 h-16 rounded-2xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
                  <Sparkles size={28} className="text-[#C9A70A]" />
                </div>
                <p className="text-base font-semibold text-white/40 text-center">Your email will appear here</p>
                <p className="text-sm text-white/20 text-center max-w-xs">Describe what you need on the left and hit Generate</p>
              </div>
            )}

            {/* Generating state */}
            {generating && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5 p-12">
                <div className="w-16 h-16 rounded-2xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
                  <Sparkles size={28} className="text-[#C9A70A] animate-pulse" />
                </div>
                <p className="text-base font-semibold text-white/60">Writing your email...</p>
                <div className="flex flex-col items-center gap-2 mt-1">
                  {GENERATING_STEPS.map((step, i) => (
                    <p
                      key={i}
                      className="text-xs text-white/25 animate-pulse"
                      style={{ animationDelay: `${i * 0.4}s` }}
                    >
                      {step}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Preview iframe */}
            {html && activeTab === 'preview' && (
              <iframe
                srcDoc={html}
                className="w-full flex-1 border-0 rounded-xl"
                title="Email Preview"
                style={{ minHeight: '620px' }}
                sandbox="allow-same-origin"
              />
            )}

            {/* HTML source */}
            {html && activeTab === 'html' && (
              <div className="flex-1 overflow-auto p-5">
                <pre className="text-xs text-green-400/80 font-mono leading-relaxed whitespace-pre-wrap break-all">
                  {html}
                </pre>
              </div>
            )}
          </div>

          {html && (
            <p className="text-xs text-white/20 text-center">
              Not quite right? Refine your prompt and generate again
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Copy, Download, RefreshCw,
  ChevronRight, Check, Eye, Code, Image as ImageIcon, Lock,
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

const IMAGE_CATEGORIES = ['all', 'hero', 'gym', 'classes', 'team', 'kids', 'hyrox', 'general']

const GENERATING_STEPS = [
  'Applying Northern Warrior branding',
  'Writing copy based on your brief',
  'Building HTML structure',
  'Placing your selected images',
  'Checking mobile responsiveness',
]

type MediaItem = {
  id: string
  filename: string
  url: string
  alt: string | null
  category: string | null
}

function ImagePicker({ onSelect }: { onSelect: (images: MediaItem[]) => void }) {
  const [media, setMedia]     = useState<MediaItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [filter, setFilter]   = useState('all')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('media')
      .select('id, filename, url, alt, category')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMedia(data) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((i) => i !== id)
      : selected.length < 3 ? [...selected, id] : selected
    setSelected(next)
    onSelect(media.filter((m) => next.includes(m.id)))
  }

  const logo     = media.find((m) => m.category === 'logo')
  const filtered = media.filter((m) =>
    m.category !== 'logo' && (filter === 'all' || m.category === filter)
  )

  return (
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
      <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-4">SELECT IMAGES</p>

      {/* Logo — always included */}
      {logo ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#967705]/10 border border-[#967705]/20 mb-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-white/[0.08]">
            <img src={logo.url} alt={logo.alt ?? 'NW Logo'} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">NW Logo</p>
            <p className="text-xs text-white/30">Always included in every email</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#C9A70A] flex items-center justify-center flex-shrink-0">
            <Lock size={10} className="text-black" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
          <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
            <ImageIcon size={18} className="text-[#967705]/50" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white/40">No logo uploaded yet</p>
            <p className="text-xs text-white/20">Upload a logo in the Media Library with category "logo"</p>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {IMAGE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === cat
                ? 'bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/30'
                : 'text-white/30 border border-white/[0.06] hover:text-white/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className={`relative rounded-lg overflow-hidden aspect-square group transition-all ${
              selected.includes(item.id)
                ? 'ring-2 ring-[#C9A70A]'
                : 'ring-1 ring-white/[0.06] hover:ring-white/20'
            }`}
          >
            <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 transition-all ${
              selected.includes(item.id) ? 'bg-[#C9A70A]/20' : 'bg-black/0 group-hover:bg-black/30'
            }`} />
            {selected.includes(item.id) && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C9A70A] flex items-center justify-center">
                <Check size={12} className="text-black" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white/70 truncate">{item.alt ?? item.filename}</p>
            </div>
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-white/30 mt-3">
          {selected.length} image{selected.length > 1 ? 's' : ''} selected — max 3
        </p>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2">
          <ImageIcon size={24} className="text-white/20" />
          <p className="text-xs text-white/30">No images in this category yet</p>
        </div>
      )}
    </div>
  )
}

export function AIEmailCreatorClient() {
  const [prompt, setPrompt]           = useState('')
  const [tone, setTone]               = useState('warm')
  const [audience, setAudience]       = useState('all_members')
  const [selectedImages, setSelectedImages] = useState<MediaItem[]>([])
  const [generating, setGenerating]   = useState(false)
  const [html, setHtml]               = useState('')
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState(false)
  const [activeTab, setActiveTab]     = useState<'preview' | 'html'>('preview')
  const [logoUrl, setLogoUrl]         = useState('')

  const supabase = createClient()

  // Fetch logo URL on mount
  useEffect(() => {
    supabase
      .from('media')
      .select('url')
      .eq('category', 'logo')
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setLogoUrl(data.url) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setHtml('')
    setError('')

    try {
      const res = await fetch('/api/email-campaigns/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, audience, selectedImages, logoUrl }),
      })
      const text = await res.text()
      if (!text) throw new Error('Empty response — the AI generation may have timed out. Try again with a shorter prompt.')
      let data: { html: string; error?: string }
      try { data = JSON.parse(text) } catch { throw new Error('Invalid response from server. Please try again.') }
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
            <p className="text-xs text-white/20 mt-1">Personalise with <span className="text-[#967705]/80 font-mono">*|FNAME|*</span> — e.g. <span className="text-white/30 font-mono">Hey *|FNAME|*,</span> — Mailchimp replaces this automatically per subscriber.</p>
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

          {/* Image picker */}
          <ImagePicker onSelect={setSelectedImages} />

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
              : <><Sparkles size={15} /> Generate Email{selectedImages.length > 0 ? ` with ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}` : ''}</>
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

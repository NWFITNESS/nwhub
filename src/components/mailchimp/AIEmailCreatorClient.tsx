'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Copy, Download, RefreshCw, Send,
  ChevronRight, Check, Eye, Code, Image as ImageIcon, Lock, FileCode,
} from 'lucide-react'
import { CampaignSendModal } from './CampaignSendModal'

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
    <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-6">
      <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-4">SELECT IMAGES</p>

      {/* Logo — always included */}
      {logo ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)] mb-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-white/[0.08]">
            <img src={logo.url} alt={logo.alt ?? 'NW Logo'} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-nw-200">NW Logo</p>
            <p className="text-xs text-nw-500">Always included in every email</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#C9A70A] flex items-center justify-center flex-shrink-0">
            <Lock size={10} className="text-black" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
          <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)] flex items-center justify-center">
            <ImageIcon size={18} className="text-gold-600/50" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-nw-400">No logo uploaded yet</p>
            <p className="text-xs text-nw-500">Upload a logo in the Media Library with category "logo"</p>
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
                ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                : 'text-nw-500 border border-white/[0.06] hover:text-nw-400'
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
              <p className="text-[10px] text-nw-200/70 truncate">{item.alt ?? item.filename}</p>
            </div>
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-nw-500 mt-3">
          {selected.length} image{selected.length > 1 ? 's' : ''} selected — max 3
        </p>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2">
          <ImageIcon size={24} className="text-nw-500" />
          <p className="text-xs text-nw-500">No images in this category yet</p>
        </div>
      )}
    </div>
  )
}

export function AIEmailCreatorClient() {
  const [mode, setMode]               = useState<'ai' | 'import'>('ai')
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
  const [importHtml, setImportHtml]   = useState('')

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

  const [campaignTitle, setCampaignTitle] = useState('')
  const [previewText, setPreviewText] = useState('')

  async function generate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setHtml('')
    setCampaignTitle('')
    setPreviewText('')
    setError('')

    try {
      const res = await fetch('/api/email-campaigns/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone, audience, selectedImages, logoUrl }),
      })

      if (!res.ok) {
        // Non-streaming error (e.g. 400/401)
        const text = await res.text()
        let msg = 'Generation failed'
        try { msg = JSON.parse(text).error ?? msg } catch {}
        throw new Error(msg)
      }

      // Read the SSE stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? '' // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6)
          try {
            const msg = JSON.parse(json)
            if (msg.error) throw new Error(msg.error)
            if (msg.done) {
              const cleanHtml = (msg.html ?? '')
                .replace(/^TITLE:.*$/gm, '')
                .replace(/^PREVIEW:.*$/gm, '')
                .replace(/^HTML:\s*$/gm, '')
                .trim()
              setHtml(cleanHtml)
              setCampaignTitle(msg.title ?? prompt.slice(0, 60))
              setPreviewText(msg.preview_text ?? prompt.slice(0, 150))
              setActiveTab('preview')
            }
            // chunk events are just keepalives — no UI update needed
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== json) throw parseErr
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const [sendModalOpen, setSendModalOpen] = useState(false)

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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-1">EMAIL CAMPAIGNS</p>
          <h1 className="text-3xl font-bold text-nw-100" style={{ fontFamily: 'League Spartan' }}>
            {mode === 'ai' ? 'AI Email Creator' : 'Import HTML Email'}
          </h1>
          <p className="text-sm text-nw-400 mt-1">
            {mode === 'ai'
              ? 'Describe your email — get a fully branded HTML template in seconds'
              : 'Paste your pre-built HTML email code and send it as a campaign'}
          </p>
        </div>
        <div className="flex bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-lg p-1 gap-1 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={() => { setMode('ai'); setHtml(''); setCampaignTitle(''); setPreviewText(''); setActiveTab('preview') }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              mode === 'ai'
                ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                : 'text-nw-500 hover:text-nw-400'
            }`}
          >
            <Sparkles size={12} /> AI Creator
          </button>
          <button
            onClick={() => { setMode('import'); setHtml(''); setCampaignTitle(''); setPreviewText(''); setActiveTab('preview') }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              mode === 'import'
                ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                : 'text-nw-500 hover:text-nw-400'
            }`}
          >
            <FileCode size={12} /> Import HTML
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── LEFT — Input panel ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {mode === 'ai' ? (
            <>
              {/* Prompt */}
              <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-6">
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-4">DESCRIBE YOUR EMAIL</p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
                  placeholder={`e.g. Announce our new Hyrox training programme starting in April. Target adult members. Include what Hyrox is, class times (Mon/Wed 6:30pm), and a CTA to book a free taster session...`}
                  rows={6}
                  className="w-full bg-nw-800 border border-[rgba(255,255,255,0.09)] rounded-lg px-4 py-3 text-sm text-nw-200 placeholder:text-nw-500 resize-none focus:outline-none focus:border-[rgba(212,160,23,0.4)] transition-colors leading-relaxed"
                />
                <p className="text-xs text-nw-500 mt-2">The more detail you give, the better the email. Press ⌘+Enter to generate.</p>
                <p className="text-xs text-nw-500 mt-1">Personalise with <span className="text-gold-600/80 font-mono">*|FNAME|*</span> — e.g. <span className="text-nw-500 font-mono">Hey *|FNAME|*,</span> — Mailchimp replaces this automatically per subscriber.</p>
              </div>

              {/* Options */}
              <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-6">
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-4">OPTIONS</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-nw-400 uppercase tracking-[0.1em] mb-1.5">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-nw-800 border border-[rgba(255,255,255,0.09)] rounded-lg px-3.5 py-2.5 text-sm text-nw-200 focus:outline-none focus:border-[rgba(212,160,23,0.4)] transition-colors"
                    >
                      {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-nw-400 uppercase tracking-[0.1em] mb-1.5">Audience</label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full bg-nw-800 border border-[rgba(255,255,255,0.09)] rounded-lg px-3.5 py-2.5 text-sm text-nw-200 focus:outline-none focus:border-[rgba(212,160,23,0.4)] transition-colors"
                    >
                      {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Image picker */}
              <ImagePicker onSelect={setSelectedImages} />

              {/* Quick prompts */}
              <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-6">
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-4">QUICK START</p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(qp)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm text-nw-400 bg-white/[0.02] border border-white/[0.05] hover:text-nw-200 hover:border-[#967705]/30 hover:bg-[#967705]/5 transition-all duration-200 group"
                    >
                      <span>{qp}</span>
                      <ChevronRight size={13} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gold-400 transition-opacity ml-3" />
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
            </>
          ) : (
            <>
              {/* Import mode — Campaign details */}
              <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-6">
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-4">CAMPAIGN DETAILS</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-nw-400 uppercase tracking-[0.1em] mb-1.5">Campaign Title</label>
                    <input
                      value={campaignTitle}
                      onChange={e => setCampaignTitle(e.target.value)}
                      placeholder="e.g. April Newsletter"
                      className="h-10 w-full bg-nw-800 border border-[rgba(255,255,255,0.09)] rounded-lg px-3.5 text-sm text-nw-200 placeholder:text-nw-500 focus:outline-none focus:border-[rgba(212,160,23,0.4)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-nw-400 uppercase tracking-[0.1em] mb-1.5">Preview Text</label>
                    <input
                      value={previewText}
                      onChange={e => setPreviewText(e.target.value)}
                      placeholder="Shown in inbox before opening"
                      className="h-10 w-full bg-nw-800 border border-[rgba(255,255,255,0.09)] rounded-lg px-3.5 text-sm text-nw-200 placeholder:text-nw-500 focus:outline-none focus:border-[rgba(212,160,23,0.4)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Import mode — HTML input */}
              <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl p-6">
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-[0.15em] mb-4">PASTE HTML CODE</p>
                <textarea
                  value={importHtml}
                  onChange={(e) => setImportHtml(e.target.value)}
                  placeholder="Paste your HTML email code here..."
                  rows={18}
                  spellCheck={false}
                  className="w-full bg-nw-800 border border-[rgba(255,255,255,0.09)] rounded-lg px-4 py-3 text-xs text-green-400/80 font-mono placeholder:text-nw-500 resize-none focus:outline-none focus:border-[rgba(212,160,23,0.4)] transition-colors leading-relaxed"
                />
                <p className="text-xs text-nw-500 mt-2">
                  Use <span className="text-gold-600/80 font-mono">*|FNAME|*</span>, <span className="text-gold-600/80 font-mono">*|LNAME|*</span>, <span className="text-gold-600/80 font-mono">*|UNSUB|*</span> for Mailchimp merge tags.
                </p>
              </div>

              {/* Load into preview */}
              <button
                onClick={() => { setHtml(importHtml); setActiveTab('preview') }}
                disabled={!importHtml.trim() || !campaignTitle.trim()}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(201,167,10,0.2)]"
              >
                <Eye size={15} /> Preview Email
              </button>
            </>
          )}
        </div>

        {/* ── RIGHT — Preview panel ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* AI-generated title + preview text (AI mode only — import mode has these on the left) */}
          {mode === 'ai' && html && campaignTitle && (
            <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500 mb-1.5">Campaign Title</label>
                <input
                  value={campaignTitle}
                  onChange={e => setCampaignTitle(e.target.value)}
                  className="h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-nw-200 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500 mb-1.5">Preview Text</label>
                <input
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  className="h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-nw-200 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
                  style={{ fontSize: 13 }}
                  placeholder="Shown in inbox before opening"
                />
              </div>
            </div>
          )}

          {/* Tab bar + actions */}
          {html && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-lg p-1 gap-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'preview'
                      ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                      : 'text-nw-500 hover:text-nw-400'
                  }`}
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'html'
                      ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                      : 'text-nw-500 hover:text-nw-400'
                  }`}
                >
                  <Code size={12} /> HTML
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyHTML}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-nw-400 border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] hover:text-nw-200 hover:border-[rgba(255,255,255,0.14)] transition-all"
                >
                  {copied ? <><Check size={12} className="text-[#4ade80]" /> Copied!</> : <><Copy size={12} /> Copy HTML</>}
                </button>
                <button
                  onClick={downloadHTML}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-nw-400 border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] hover:text-nw-200 hover:border-[rgba(255,255,255,0.14)] transition-all"
                >
                  <Download size={12} /> Download
                </button>
                <button
                  onClick={() => setSendModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)] transition-all"
                >
                  <Send size={12} /> Send to Campaign
                </button>
              </div>
            </div>
          )}

          {/* Output area */}
          <div className="bg-nw-750 border border-[rgba(255,255,255,0.11)] rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '620px' }}>

            {/* Empty state */}
            {!html && !generating && (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 p-12">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)] flex items-center justify-center">
                  {mode === 'ai' ? <Sparkles size={28} className="text-gold-400" /> : <FileCode size={28} className="text-gold-400" />}
                </div>
                <p className="text-base font-semibold text-nw-400 text-center">Your email will appear here</p>
                <p className="text-sm text-nw-500 text-center max-w-xs">
                  {mode === 'ai'
                    ? 'Describe what you need on the left and hit Generate'
                    : 'Paste your HTML code on the left and click Preview Email'}
                </p>
              </div>
            )}

            {/* Generating state */}
            {generating && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5 p-12">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)] flex items-center justify-center">
                  <Sparkles size={28} className="text-gold-400 animate-pulse" />
                </div>
                <p className="text-base font-semibold text-nw-400">Writing your email...</p>
                <div className="flex flex-col items-center gap-2 mt-1">
                  {GENERATING_STEPS.map((step, i) => (
                    <p
                      key={i}
                      className="text-xs text-nw-200/25 animate-pulse"
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

          {html && mode === 'ai' && (
            <p className="text-xs text-nw-500 text-center">
              Not quite right? Refine your prompt and generate again
            </p>
          )}
        </div>
      </div>

      {/* Campaign send modal */}
      <CampaignSendModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        html={html}
        title={campaignTitle}
        previewText={previewText}
      />
    </div>
  )
}

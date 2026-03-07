'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm the Northern Warrior assistant. How can I help you today? Ask me about classes, membership, timetables — anything at all.",
  timestamp: new Date().toISOString(),
}

// ─── Message bubble ────────────────────────────────────────────────────────
function Bubble({ msg, streaming }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#967705]/20 border border-[#967705]/30 text-white rounded-br-sm'
            : 'bg-[#1a1a1a] border border-white/[0.08] text-white/85 rounded-bl-sm'
        }`}
      >
        <p style={{ whiteSpace: 'pre-wrap' }}>
          {msg.content}
          {streaming && (
            <span className="inline-block w-0.5 h-3.5 bg-white/60 ml-0.5 align-middle animate-pulse" />
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Main widget ───────────────────────────────────────────────────────────
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputBarRef = useRef<HTMLDivElement>(null)

  // Initialise session ID from localStorage (client-only)
  useEffect(() => {
    const stored = localStorage.getItem('nw_chat_session_id')
    const id = stored ?? crypto.randomUUID()
    if (!stored) localStorage.setItem('nw_chat_session_id', id)
    setSessionId(id)
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 300)
  }, [open])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !sessionId) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setError(null)
    setIsStreaming(true)
    setStreamingContent('')

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    let assistantText = ''
    let buffer = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.text) {
              assistantText += payload.text
              setStreamingContent(assistantText)
            }
            if (payload.lead_captured) setLeadCaptured(true)
            if (payload.error) throw new Error(payload.error)
            if (payload.done) {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: assistantText, timestamp: new Date().toISOString() },
              ])
              setStreamingContent('')
              setIsStreaming(false)
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      setStreamingContent('')
      setIsStreaming(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }, [input, isStreaming, sessionId, messages])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
            style={{ transformOrigin: 'bottom right', background: '#0d0d0d' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0"
              style={{ background: 'linear-gradient(135deg, #131313 0%, #0e0e0e 100%)' }}
            >
              <div className="w-8 h-8 rounded-full bg-[#967705]/20 border border-[#967705]/30 flex items-center justify-center shrink-0">
                <span className="text-[#c9a70a] text-xs font-bold">NW</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Northern Warrior</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-[11px] text-white/40">AI Assistant · typically instant</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/30 hover:text-white/70 transition-colors p-1"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <Bubble key={i} msg={msg} />
              ))}
              {isStreaming && streamingContent && (
                <Bubble
                  msg={{ role: 'assistant', content: streamingContent, timestamp: '' }}
                  streaming
                />
              )}
              {isStreaming && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {leadCaptured && (
                <div className="flex justify-center">
                  <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                    Details saved — the team will be in touch!
                  </span>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    {error}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp CTA */}
            {WHATSAPP_NUMBER && (
              <div className="shrink-0 px-4 py-2 border-t border-white/[0.05]">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[11px] text-green-400/70 hover:text-green-400 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.119 1.526 5.847L.057 23.882l6.224-1.633A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.375l-.36-.213-3.695.969.987-3.604-.235-.371A9.818 9.818 0 1112 21.818z" />
                  </svg>
                  Chat on WhatsApp for faster response
                </a>
              </div>
            )}

            {/* Input bar */}
            <div ref={inputBarRef} className="shrink-0 flex items-end gap-2 px-3 py-3 border-t border-white/[0.08]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors disabled:opacity-50"
                style={{ minHeight: '38px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 rounded-xl bg-[#967705] hover:bg-[#b08e06] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                aria-label="Send message"
              >
                {isStreaming ? (
                  <Loader2 size={15} className="text-black animate-spin" />
                ) : (
                  <Send size={15} className="text-black" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative"
      >
        {/* Pulse ring */}
        {!open && (
          <div className="absolute inset-0 rounded-full bg-[#c9a70a]/25 animate-ping pointer-events-none" />
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative w-14 h-14 rounded-full bg-[#967705] hover:bg-[#b08e06] flex items-center justify-center transition-colors shadow-[0_0_30px_rgba(150,119,5,0.45)]"
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={22} className="text-black" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageSquare size={22} className="text-black" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </motion.div>
    </div>
  )
}

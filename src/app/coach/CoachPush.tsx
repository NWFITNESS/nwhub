'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

type State = 'loading' | 'unsupported' | 'off' | 'on' | 'denied'

export function CoachPush() {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const supported =
        'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!supported || !VAPID_PUBLIC) { if (!cancelled) setState('unsupported'); return }
      try {
        const reg = await navigator.serviceWorker.register('/coach-sw.js', { scope: '/coach' })
        const sub = await reg.pushManager.getSubscription()
        if (cancelled) return
        if (Notification.permission === 'denied') setState('denied')
        else setState(sub ? 'on' : 'off')
      } catch {
        if (!cancelled) setState('unsupported')
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  async function enable() {
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
      const res = await fetch('/api/coach-rota/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
      setState(res.ok ? 'on' : 'off')
    } catch {
      setState('off')
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setBusy(true)
    try { await fetch('/api/coach-rota/push/test', { method: 'POST' }) }
    finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/coach-rota/push/unsubscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading' || state === 'unsupported') return null

  const wrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, margin: '0 10px 12px',
    padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
  }

  if (state === 'denied') {
    return (
      <div style={wrap}>
        <BellOff size={17} color="#8296b4" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12.5, color: '#8296b4', lineHeight: 1.4 }}>
          Reminders are blocked. Enable notifications for this site in your phone/browser settings to get a nudge before your sessions.
        </div>
      </div>
    )
  }

  if (state === 'on') {
    return (
      <div style={wrap}>
        <BellRing size={17} color="#6ee7a0" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#cdd8e8' }}>Session reminders on</div>
        <button onClick={sendTest} disabled={busy} style={linkBtn}>{busy ? '…' : 'Send test'}</button>
        <button onClick={disable} disabled={busy} style={linkBtn}>Turn off</button>
      </div>
    )
  }

  // off
  return (
    <div style={wrap}>
      <Bell size={17} color="#f5d775" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#edf3fb' }}>Get a nudge before you coach</div>
        <div style={{ fontSize: 12, color: '#8296b4' }}>A notification ~1 hour before each session you&rsquo;re on.</div>
      </div>
      <button onClick={enable} disabled={busy} style={{
        flexShrink: 0, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        border: '1px solid rgba(212,160,23,0.5)', background: 'rgba(212,160,23,0.22)', color: '#f5d775',
      }}>{busy ? 'Enabling…' : 'Turn on'}</button>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  flexShrink: 0, background: 'none', border: 'none', color: '#8296b4',
  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
}

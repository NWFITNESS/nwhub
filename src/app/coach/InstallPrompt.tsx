'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'nw_coach_install_dismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)

  useEffect(() => {
    // Already installed? (running standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const ua = window.navigator.userAgent
    const iOS = /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document) // iPadOS
    setIsIOS(iOS)

    if (iOS) {
      setShow(true)   // iOS can't auto-prompt — offer the manual guide
      return
    }

    const onBIP = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onBIP)
    const onInstalled = () => { setShow(false); localStorage.setItem(DISMISS_KEY, '1') }
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() { setShow(false); localStorage.setItem(DISMISS_KEY, '1') }

  async function install() {
    if (isIOS) { setIosHelp(true); return }
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      <div style={{
        position: 'relative', zIndex: 30, display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: 'rgba(201,167,10,0.12)', borderBottom: '1px solid rgba(212,160,23,0.25)',
      }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(212,160,23,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Download size={17} color="#f5d775" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#edf3fb' }}>Add to home screen</div>
          <div style={{ fontSize: 12, color: '#b9c6da' }}>Open the rota like an app, full-screen.</div>
        </div>
        <button onClick={install} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(212,160,23,0.5)', background: 'rgba(212,160,23,0.24)', color: '#f5d775' }}>Install</button>
        <button onClick={dismiss} aria-label="Dismiss" style={{ flexShrink: 0, background: 'none', border: 'none', color: '#8296b4', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
      </div>

      {/* iOS manual instructions */}
      {iosHelp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setIosHelp(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#121820', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTop: '1px solid rgba(255,255,255,0.1)', padding: 22, paddingBottom: 'max(22px, env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#edf3fb' }}>Add to Home Screen</h2>
              <button onClick={() => setIosHelp(false)} style={{ background: 'none', border: 'none', color: '#8296b4', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <li style={stepRow}>
                <span style={stepNum}>1</span>
                <span style={{ fontSize: 14.5, color: '#edf3fb' }}>Tap the <strong>Share</strong> button <Share size={15} style={{ display: 'inline', verticalAlign: 'middle', color: '#5a8bd6' }} /> in Safari’s toolbar.</span>
              </li>
              <li style={stepRow}>
                <span style={stepNum}>2</span>
                <span style={{ fontSize: 14.5, color: '#edf3fb' }}>Scroll down and tap <strong>Add to Home Screen</strong> <Plus size={15} style={{ display: 'inline', verticalAlign: 'middle', color: '#b9c6da' }} />.</span>
              </li>
              <li style={stepRow}>
                <span style={stepNum}>3</span>
                <span style={{ fontSize: 14.5, color: '#edf3fb' }}>Tap <strong>Add</strong> — the Coach Rota icon appears on your home screen.</span>
              </li>
            </ol>
            <button onClick={() => { setIosHelp(false); dismiss() }} style={{ marginTop: 20, width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'rgba(212,160,23,0.2)', color: '#f5d775', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}
    </>
  )
}

const stepRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12 }
const stepNum: React.CSSProperties = { flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: 'rgba(212,160,23,0.18)', color: '#f5d775', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }

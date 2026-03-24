'use client'
import { useEffect, useRef, useState } from 'react'
import { NWHubIcon } from './NWHubIcon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('nwhub_install_dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setTimeout(() => setShow(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') localStorage.removeItem('nwhub_install_dismissed')
    setShow(false)
    deferredPrompt.current = null
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('nwhub_install_dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4 sm:items-end sm:justify-end sm:pr-8">
      <div className="absolute inset-0 bg-black/70" onClick={handleDismiss}/>
      <div className="relative rounded-2xl p-6 max-w-sm w-full" style={{
        background: '#0a0f1c',
        border: '1px solid rgba(201,168,76,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        animation: 'nwhub-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
        <div className="flex items-center gap-4 mb-4">
          <NWHubIcon size={48} animated={true} />
          <div>
            <p className="text-white font-bold text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Install NWHub</p>
            <p className="text-sm" style={{ color: '#c9a84c' }}>Northern Warrior Hub</p>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: '#4a5a7a', lineHeight: '1.6' }}>
          Get the full app experience — instant access from your desktop or dock, faster, feels native.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#6a7a9a', background: 'transparent' }}
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold hover:brightness-110"
            style={{ background: '#c9a84c', color: '#06080f' }}
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  )
}

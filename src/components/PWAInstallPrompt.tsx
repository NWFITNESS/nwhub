'use client'
import { useEffect, useRef, useState } from 'react'
import { NWHubIcon } from './NWHubIcon'
import { Download, X, Zap, Monitor, Lock } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [installing, setInstalling] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('nwhub_install_dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setTimeout(() => setShow(true), 1500)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt.current) return
    setInstalling(true)
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') localStorage.removeItem('nwhub_install_dismissed')
    setInstalling(false)
    setShow(false)
    deferredPrompt.current = null
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('nwhub_install_dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6 px-4 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1c1b1b 0%, #201f1f 100%)',
          border: '1px solid rgba(212,175,55,0.25)',
          boxShadow: '0 -4px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.05), inset 0 1px 0 rgba(212,175,55,0.08)',
          animation: 'nwhub-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* Gold top accent line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6) 50%, transparent)' }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <NWHubIcon size={52} animated={true} />
            <div className="flex-1 min-w-0">
              <p
                className="text-[#e5e2e1] font-bold text-lg leading-tight"
                style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
              >
                Install NWHub
              </p>
              <p className="text-[#d4af37] text-sm font-medium">Northern Warrior Hub</p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#d0c5af]/30 hover:text-[#d0c5af]/70 hover:bg-[#2a2a2a] transition-all flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex items-center gap-2 mb-5">
            {[
              { icon: Zap, label: 'Instant access' },
              { icon: Monitor, label: 'Lives in dock' },
              { icon: Lock, label: 'No browser UI' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#d0c5af]/60"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}
              >
                <Icon size={10} className="text-[#d4af37]/60" />
                {label}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#d0c5af]/50 hover:text-[#d0c5af]/80 hover:bg-[#2a2a2a] transition-all border border-[#4d4635]/25"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #c9a70a, #d4af37)', color: '#3c2f00' }}
            >
              <Download size={14} />
              {installing ? 'Installing…' : 'Install App'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import { NWHubIcon } from './NWHubIcon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function AppInstallSetting() {
  const [isInstalled, setIsInstalled]     = useState(false)
  const [canInstall, setCanInstall]       = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) { setIsInstalled(true); return }
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setJustInstalled(true)
      localStorage.removeItem('nwhub_install_dismissed')
    }
    deferredPrompt.current = null
    setCanInstall(false)
  }

  return (
    <div className="rounded-xl p-6" style={{ background: '#0a0f1c', border: '1px solid #111825' }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <NWHubIcon size={40} animated={false} />
          <div>
            <p className="font-semibold text-white">Desktop App</p>
            <p className="text-sm" style={{ color: '#3a4a6a' }}>
              {isInstalled
                ? justInstalled ? '✓ Installed — check your dock or taskbar' : '✓ NWHub is installed'
                : 'Install NWHub to your desktop for faster access'}
            </p>
          </div>
        </div>
        {isInstalled ? (
          <span className="text-sm font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}>
            Installed ✓
          </span>
        ) : canInstall ? (
          <button onClick={handleInstall} className="text-sm font-bold px-4 py-2 rounded-lg flex-shrink-0 hover:brightness-110"
            style={{ background: '#c9a84c', color: '#06080f' }}>
            Install App
          </button>
        ) : (
          <span className="text-sm flex-shrink-0" style={{ color: '#2a3448' }}>Use Chrome or Edge to install</span>
        )}
      </div>
      {!isInstalled && (
        <div className="mt-4 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid #111825' }}>
          {[
            { icon: '⚡', label: 'Faster access' },
            { icon: '🖥️', label: 'Lives in your dock' },
            { icon: '🔒', label: 'No browser chrome' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg">{icon}</span>
              <span className="text-xs" style={{ color: '#2a3448' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

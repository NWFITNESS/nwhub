'use client'
import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function SidebarInstallBox() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
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
      setCanInstall(false)
    }
    deferredPrompt.current = null
  }

  if (isInstalled) return null

  return (
    <div className="ml-5 mr-3 mb-2 p-3 rounded-lg border border-[#d4af37]/20 bg-[#d4af37]/5 flex items-center gap-3">
      <div className="w-7 h-7 rounded-md bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0">
        <Download size={13} className="text-[#f2ca50]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#e5e2e1] leading-tight">Install App</p>
        <p className="text-[10px] text-[#d0c5af]/45 leading-tight">Add to desktop</p>
      </div>
      {canInstall ? (
        <button
          onClick={handleInstall}
          className="text-[11px] font-bold px-2.5 py-1 rounded-md flex-shrink-0 transition-all hover:brightness-110 active:scale-95"
          style={{ background: '#d4af37', color: '#3c2f00' }}
        >
          Install
        </button>
      ) : (
        <span className="text-[10px] text-[#d0c5af]/35 flex-shrink-0 text-right leading-tight">
          Use<br />Chrome
        </span>
      )}
    </div>
  )
}

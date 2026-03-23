'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Link2, Unlink, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// ─── Platform icons ───────────────────────────────────────────────────────────

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformStatus {
  connected: boolean
  // Facebook
  page_name?: string
  page_id?: string
  // Instagram
  username?: string
  ig_user_id?: string
  // LinkedIn
  organization_name?: string
  organization_id?: string
  expires_at?: string | null
  // shared
  connected_at?: string
}

interface Connections {
  facebook: PlatformStatus
  instagram: PlatformStatus
  linkedin: PlatformStatus
}

// ─── Platform card ────────────────────────────────────────────────────────────

interface PlatformConfig {
  id: 'facebook' | 'instagram' | 'linkedin'
  label: string
  colour: string
  authRoute: string
  icon: React.ComponentType<{ size?: number }>
  getSubtitle: (s: PlatformStatus) => string
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    colour: '#1877F2',
    authRoute: '/api/social/auth/meta',
    icon: FacebookIcon,
    getSubtitle: (s) => (s.connected ? `Page: ${s.page_name}` : 'Post to your Facebook Page'),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    colour: '#E1306C',
    authRoute: '/api/social/auth/meta',
    icon: InstagramIcon,
    getSubtitle: (s) =>
      s.connected
        ? `@${s.username || s.ig_user_id}`
        : 'Connected automatically via Facebook',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    colour: '#0A66C2',
    authRoute: '/api/social/auth/linkedin',
    icon: LinkedInIcon,
    getSubtitle: (s) =>
      s.connected ? `Page: ${s.organization_name}` : 'Post to your LinkedIn Company Page',
  },
]

function PlatformCard({
  config,
  status,
  onDisconnect,
  disconnecting,
}: {
  config: PlatformConfig
  status: PlatformStatus
  onDisconnect: (id: string) => void
  disconnecting: string | null
}) {
  const Icon = config.icon
  const isInstagram = config.id === 'instagram'

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#161616] border border-white/[0.08] p-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Platform icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${config.colour}18`, color: config.colour }}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-sm">{config.label}</p>
            {status.connected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle size={11} />
                Connected
              </span>
            ) : (
              <span className="text-xs text-white/30">Not connected</span>
            )}
          </div>
          <p className="text-xs text-white/40 truncate mt-0.5">{config.getSubtitle(status)}</p>
          {status.connected && status.connected_at && (
            <p className="text-xs text-white/25 mt-0.5">
              Since {new Date(status.connected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {status.connected ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDisconnect(config.id)}
            loading={disconnecting === config.id}
            className="gap-1.5"
          >
            <Unlink size={12} />
            Disconnect
          </Button>
        ) : (
          <a
            href={isInstagram ? '#' : config.authRoute}
            onClick={isInstagram ? (e) => e.preventDefault() : undefined}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-semibold transition-all duration-150 ${
              isInstagram
                ? 'opacity-40 cursor-not-allowed bg-[#1e1e1e] border border-white/10 text-white/50'
                : 'bg-[#967705] hover:bg-[#b08e06] text-black hover:shadow-[0_0_28px_rgba(150,119,5,0.4)] active:scale-[0.98]'
            }`}
            title={isInstagram ? 'Instagram connects automatically when you connect Facebook' : undefined}
          >
            <Link2 size={13} />
            {isInstagram ? 'Via Facebook' : 'Connect'}
            {!isInstagram && <ExternalLink size={11} className="opacity-60" />}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SocialConnections() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [connections, setConnections] = useState<Connections | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => {
    // Show OAuth callback result if present in URL
    const success = searchParams.get('social_success')
    const error = searchParams.get('social_error')
    if (success) showToast('success', decodeURIComponent(success))
    if (error) showToast('error', decodeURIComponent(error))
    // Clean up URL params
    if (success || error) {
      const url = new URL(window.location.href)
      url.searchParams.delete('social_success')
      url.searchParams.delete('social_error')
      router.replace(url.pathname + url.search)
    }
  }, [searchParams, showToast, router])

  useEffect(() => {
    fetch('/api/social/connections')
      .then((r) => r.json())
      .then((data) => setConnections(data))
      .finally(() => setLoading(false))
  }, [])

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform)
    try {
      await fetch(`/api/social/connections?platform=${platform}`, { method: 'DELETE' })
      // Refresh
      const data = await fetch('/api/social/connections').then((r) => r.json())
      setConnections(data)
      showToast('success', `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`)
    } finally {
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[72px] rounded-xl bg-[#161616] border border-white/[0.08] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!connections) return null

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.message}
        </div>
      )}

      {/* Platform cards */}
      <div className="space-y-3">
        {PLATFORMS.map((config) => (
          <PlatformCard
            key={config.id}
            config={config}
            status={connections[config.id]}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting}
          />
        ))}
      </div>

      {/* Setup note */}
      <p className="text-xs text-white/25 leading-relaxed">
        Facebook & Instagram use the same Meta App OAuth flow — connecting Facebook will automatically connect any linked Instagram Business account.
        LinkedIn requires a separate connection. Tokens are stored securely in your Supabase settings.
      </p>
    </div>
  )
}

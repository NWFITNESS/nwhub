import type { Metadata } from 'next'
import { InstallPrompt } from './InstallPrompt'

export const metadata: Metadata = {
  title: 'NW Coach Rota',
  manifest: '/coach.webmanifest',
  // Distinct home-screen icon from the admin "NWHub" app (gold NW·COACH tile)
  icons: { apple: [{ url: '/icons/coach-apple-180.png', sizes: '180x180' }] },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NW Coach',
  },
}

const coachStyles = `
@keyframes cs-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes cs-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes cs-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes cs-shimmer { 0% { background-position: -420px 0; } 100% { background-position: 420px 0; } }
@keyframes cs-spin { to { transform: rotate(360deg); } }
.cs-sheet { animation: cs-sheet-up .32s cubic-bezier(.16,1,.3,1); }
.cs-backdrop { animation: cs-backdrop-in .22s ease; }
.cs-pop { animation: cs-pop .26s cubic-bezier(.16,1,.3,1) both; }
.cs-press { transition: transform .09s ease, filter .12s ease; -webkit-tap-highlight-color: transparent; }
.cs-press:active { transform: scale(.96); filter: brightness(1.08); }
.cs-skel { background: linear-gradient(90deg, rgba(255,255,255,.035) 25%, rgba(255,255,255,.08) 37%, rgba(255,255,255,.035) 63%); background-size: 840px 100%; animation: cs-shimmer 1.5s infinite linear; }
.cs-spin { animation: cs-spin .7s linear infinite; }
@media (prefers-reduced-motion: reduce) { .cs-sheet, .cs-backdrop, .cs-pop, .cs-skel, .cs-spin { animation: none !important; } }
`

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#090c12', color: '#edf3fb' }}>
      <style dangerouslySetInnerHTML={{ __html: coachStyles }} />
      <InstallPrompt />
      {children}
    </div>
  )
}

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

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#090c12', color: '#edf3fb' }}>
      <InstallPrompt />
      {children}
    </div>
  )
}

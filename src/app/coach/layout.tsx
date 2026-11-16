import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NW Coach Rota',
  manifest: '/coach.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NW Coach',
  },
}

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#090c12', color: '#edf3fb' }}>
      {children}
    </div>
  )
}

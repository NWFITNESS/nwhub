import type { Metadata } from 'next'
import { Inter, League_Spartan, Manrope, Oswald, Roboto_Slab } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const leagueSpartan = League_Spartan({ subsets: ['latin'], variable: '--font-league-spartan', weight: ['400', '500', '600', '700', '800', '900'] })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['300', '400', '500', '600', '700'] })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-roboto-slab' })

export const metadata: Metadata = {
  title: 'NWHub',
  description: 'Northern Warrior Business Hub',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png',     sizes: '180x180' },
      { url: '/icons/apple-touch-icon-167.png', sizes: '167x167' },
      { url: '/icons/apple-touch-icon-152.png', sizes: '152x152' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NWHub',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#06080f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NWHub" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${leagueSpartan.variable} ${manrope.variable} ${oswald.variable} ${robotoSlab.variable} font-sans antialiased`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}

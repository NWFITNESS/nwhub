import type { Metadata, Viewport } from 'next'
import { Inter, League_Spartan, Manrope, Oswald, Roboto_Slab, Rajdhani } from 'next/font/google'
import './globals.css'
import 'react-grid-layout/css/styles.css'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const leagueSpartan = League_Spartan({ subsets: ['latin'], variable: '--font-league-spartan', weight: ['400', '500', '600', '700', '800', '900'] })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['300', '400', '500', '600', '700'] })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-roboto-slab' })
const rajdhani = Rajdhani({ subsets: ['latin'], variable: '--font-rajdhani', weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'NWHub',
  description: 'Northern Warrior Business Hub',
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

// viewportFit: 'cover' lets env(safe-area-inset-*) work under the translucent
// status bar / home indicator on iOS (the app runs as an installed PWA).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#090c12',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=JSON.parse(localStorage.getItem('nwhub-theme')||'{}');if(t.state&&t.state.theme==='light')document.documentElement.classList.add('nw-light')}catch(e){try{if(localStorage.getItem('nw-theme')==='light')document.documentElement.classList.add('nw-light')}catch(e2){}}` }} />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${leagueSpartan.variable} ${manrope.variable} ${oswald.variable} ${robotoSlab.variable} ${rajdhani.variable} font-ui antialiased bg-[#090c12]`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter, League_Spartan, Manrope, Oswald, Roboto_Slab } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const leagueSpartan = League_Spartan({ subsets: ['latin'], variable: '--font-league-spartan', weight: ['400', '500', '600', '700', '800', '900'] })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['300', '400', '500', '600', '700'] })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-roboto-slab' })

export const metadata: Metadata = {
  title: 'NWHub — Admin Panel',
  description: 'Northern Warrior Admin Panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.variable} ${leagueSpartan.variable} ${manrope.variable} ${oswald.variable} ${robotoSlab.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

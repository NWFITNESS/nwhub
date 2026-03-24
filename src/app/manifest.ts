import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NWHub - Northern Warrior',
    short_name: 'NWHub',
    description: 'Northern Warrior Business Hub - CRM, Marketing & Management',
    start_url: '/',
    display: 'standalone',
    background_color: '#06080f',
    theme_color: '#06080f',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}

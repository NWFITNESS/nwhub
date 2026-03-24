'use client'
import { useId } from 'react'

interface NWHubIconProps {
  size?: number
  className?: string
  animated?: boolean
}

export function NWHubIcon({ size = 48, className = '', animated = true }: NWHubIconProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${name}-${uid}`
  const url = (name: string) => `url(#${id(name)})`

  return (
    <svg
      className={`nwhub-compass ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: animated ? 'pointer' : 'default', flexShrink: 0 }}
      onMouseEnter={animated ? (e) => {
        const needle = (e.currentTarget as SVGElement).querySelector('.nwhub-needle') as SVGElement | null
        if (needle) {
          needle.style.animation = 'none'
          void needle.getBoundingClientRect()
          needle.style.animation = ''
        }
      } : undefined}
    >
      <defs>
        <radialGradient id={id('hbg')} cx="45%" cy="40%" r="75%">
          <stop offset="0%"   stopColor="#0e1628"/>
          <stop offset="60%"  stopColor="#080c18"/>
          <stop offset="100%" stopColor="#040609"/>
        </radialGradient>
        <radialGradient id={id('ambientNW')} cx="25%" cy="25%" r="55%">
          <stop offset="0%"   stopColor="#c9a84c" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={id('ambientSE')} cx="75%" cy="75%" r="45%">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.06"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={id('hng')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fff8d6"/>
          <stop offset="15%"  stopColor="#f5c842"/>
          <stop offset="45%"  stopColor="#c9980c"/>
          <stop offset="75%"  stopColor="#e8b830"/>
          <stop offset="100%" stopColor="#7a5410"/>
        </linearGradient>
        <linearGradient id={id('hnb')} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#93c5fd"/>
          <stop offset="40%"  stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#1e3a8a"/>
        </linearGradient>
        <linearGradient id={id('hring')} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.8"/>
          <stop offset="30%"  stopColor="#3b82f6" stopOpacity="0.5"/>
          <stop offset="50%"  stopColor="#c9a84c" stopOpacity="0.4"/>
          <stop offset="70%"  stopColor="#f0c84a" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#fff5c0" stopOpacity="0.9"/>
        </linearGradient>
        <linearGradient id={id('hring2')} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#1e3a8a" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.12"/>
        </linearGradient>
        <linearGradient id={id('hhub')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f5c842"/>
          <stop offset="100%" stopColor="#b08020"/>
        </linearGradient>
        <linearGradient id={id('hbdr')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f0c84a" stopOpacity="0.85"/>
          <stop offset="40%"  stopColor="#c9a84c" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.55"/>
        </linearGradient>
        <linearGradient id={id('hgs')} x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.055"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
        <filter id={id('hgg')} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="1.3 0.8 0 0 0  0.9 0.65 0 0 0  0 0.1 0 0 0  0 0 0 1.3 0" result="gld"/>
          <feMerge><feMergeNode in="gld"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={id('hbgf')} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0.2 0.5 1 0 0  0.4 0.7 1.5 0 0  0 0 0 1.2 0" result="blu"/>
          <feMerge><feMergeNode in="blu"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={id('hhg')} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
        <filter id={id('hdg')} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={id('hsa')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
        <clipPath id={id('roundClip')}>
          <rect width="100" height="100" rx="22"/>
        </clipPath>
      </defs>

      {/* BASE */}
      <rect width="100" height="100" rx="22" fill={url('hbg')}/>
      <rect width="100" height="100" rx="22" fill={url('ambientNW')}/>
      <rect width="100" height="100" rx="22" fill={url('ambientSE')}/>
      <path d="M22 0 Q0 0 0 22 L0 45 Q28 12 45 0 Z" fill={url('hgs')} clipPath={url('roundClip')}/>

      {/* COMPASS RINGS */}
      <circle cx="50" cy="46" r="32" fill="none" stroke={url('hring')}  strokeWidth="0.9"/>
      <circle cx="50" cy="46" r="27" fill="none" stroke={url('hring2')} strokeWidth="0.5"/>
      <circle cx="50" cy="46" r="22" fill="none" stroke="#c9a84c"       strokeWidth="0.2" opacity="0.12"/>
      <circle cx="32" cy="28" r="18" fill="#c9a84c" opacity="0.06" filter={url('hsa')}/>

      {/* TICK MARKS */}
      <line x1="27.4" y1="23.4" x2="31.6" y2="27.6" stroke="#f0c84a" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="50"   y1="14"   x2="50"   y2="20"   stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <line x1="18"   y1="46"   x2="24"   y2="46"   stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <line x1="82"   y1="46"   x2="76"   y2="46"   stroke="#3b82f6" strokeWidth="0.7" strokeLinecap="round" opacity="0.4"/>
      <line x1="50"   y1="78"   x2="50"   y2="72"   stroke="#3b82f6" strokeWidth="0.7" strokeLinecap="round" opacity="0.4"/>
      <line x1="72.7" y1="23.3" x2="70.1" y2="25.9" stroke="#3b82f6" strokeWidth="0.5" opacity="0.25"/>
      <line x1="27.3" y1="68.7" x2="29.9" y2="66.1" stroke="#3b82f6" strokeWidth="0.5" opacity="0.25"/>
      <line x1="72.7" y1="68.7" x2="70.1" y2="66.1" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2"/>

      {/* NW LABEL */}
      <text x="21" y="20" fontFamily="'Black Ops One', sans-serif" fontSize="7"
        fill="#f0c84a" textAnchor="middle" dominantBaseline="middle" opacity="0.95">NW</text>

      {/* NEEDLE — rests at NW, spins one full rotation on hover then lands back on NW */}
      <g className="nwhub-needle">
        <polygon points="50,20 53.2,43 50,39.5 46.8,43" fill="#f0c84a" opacity="0.35" filter={url('hgg')}/>
        <polygon points="50,20 53.2,43 50,39.5 46.8,43" fill={url('hng')} filter={url('hdg')}/>
        <polygon points="50,20 53.2,43 50,39.5"         fill="none" stroke="#fff8d6" strokeWidth="0.3" opacity="0.45"/>
        <polygon points="50,72 52.8,49 50,52.5 47.2,49"  fill="#3b82f6" opacity="0.25" filter={url('hbgf')}/>
        <polygon points="50,72 52.8,49 50,52.5 47.2,49"  fill={url('hnb')} opacity="0.8"/>
      </g>

      {/* HUB CENTRE */}
      <circle cx="50" cy="46" r="8"   fill="#c9a84c" opacity="0.12" filter={url('hhg')}/>
      <circle cx="50" cy="46" r="5.5" fill={url('hbg')}/>
      <circle cx="50" cy="46" r="5.5" fill="none" stroke={url('hhub')} strokeWidth="1.5"/>
      <circle cx="50" cy="46" r="2.6" fill="#ffffff" opacity="0.96" filter={url('hdg')}/>

      {/* BOTTOM LABEL */}
      <line x1="22" y1="84" x2="78" y2="84" stroke="#c9a84c" strokeWidth="0.5" opacity="0.18"/>
      <text x="50" y="91.5" fontFamily="'Rajdhani', sans-serif" fontWeight="700" fontSize="7.5"
        fill="#c9a84c" textAnchor="middle" letterSpacing="4" opacity="0.45">NW · HUB</text>

      {/* BORDER */}
      <rect x="0.5" y="0.5" width="99" height="99" rx="21.5" fill="none" stroke={url('hbdr')} strokeWidth="1"/>
    </svg>
  )
}

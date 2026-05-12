'use client'

import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 32,
      }}
    >
      <div
        style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 40,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(239,68,68,0.12)',
            marginBottom: 20,
          }}
        >
          <AlertTriangle size={28} color="#ef4444" />
        </div>

        <h2
          style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#F0F0F0',
            marginBottom: 8,
          }}
        >
          Something went wrong
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <button
          onClick={reset}
          style={{
            background: 'linear-gradient(135deg, #967705, #c9a70a)',
            color: '#000',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            padding: '10px 24px',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}

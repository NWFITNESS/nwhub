'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function CoachSignOut({ compact }: { compact?: boolean }) {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/coach'
  }
  return (
    <button onClick={signOut} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
      padding: compact ? '6px 10px' : '10px 16px', fontSize: compact ? 12 : 14, fontWeight: 600,
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#8296b4',
    }}>
      <LogOut size={compact ? 13 : 15} /> Sign out
    </button>
  )
}

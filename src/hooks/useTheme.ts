'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  toggle: () => void
  set: (t: Theme) => void
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggle: () => set((s) => {
        const next = s.theme === 'dark' ? 'light' : 'dark'
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('nw-light', next === 'light')
        }
        return { theme: next }
      }),
      set: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('nw-light', theme === 'light')
        }
        set({ theme })
      },
    }),
    {
      name: 'nwhub-theme',
      onRehydrateStorage: () => (state) => {
        if (typeof document !== 'undefined' && state) {
          document.documentElement.classList.toggle('nw-light', state.theme === 'light')
        }
      },
    }
  )
)

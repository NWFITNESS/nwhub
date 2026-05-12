'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const widthMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', '2xl': 'max-w-4xl' }

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, children, width = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Save previously focused element when modal opens, restore on close
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus()
      previouslyFocusedRef.current = null
    }
  }, [open])

  // Focus first focusable element when modal opens
  useEffect(() => {
    if (!open || !modalRef.current) return
    const firstFocusable = modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    if (firstFocusable) firstFocusable.focus()
  }, [open])

  // Keyboard handler: Escape to close + Tab focus trapping
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableEls = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusableEls.length === 0) return

    const first = focusableEls[0]
    const last = focusableEls[focusableEls.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label={title || 'Dialog'} className={`relative w-full ${widthMap[width]} rounded-xl shadow-2xl`} style={{ background: 'var(--slate-800)', border: '1px solid var(--r-panel-border)' }}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--r-panel-border)' }}>
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white transition-colors">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', loading }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="sm">
      <p className="text-sm text-white/60 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

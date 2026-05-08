import { useEffect, useRef, useCallback, useState } from 'react'

export interface EditableBlock {
  id: string
  type: 'text' | 'link' | 'image' | 'meta'
  label: string
  content: string
  tag?: string // e.g. 'h1', 'p', 'a'
}

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://northernwarrior.co.uk',
  'https://northernwarrior.co.uk',
  'https://www.northernwarrior.co.uk',
  'null', // sandboxed iframes send origin as 'null'
]

export function usePostMessageBridge() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [blocks, setBlocks] = useState<EditableBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Verify origin — accept sandboxed iframe (null origin) and public site
      const origin = e.origin ?? ''
      if (!ALLOWED_ORIGINS.some(o => o === origin || o === 'null' && origin === 'null')) return

      const data = e.data
      if (!data?.type) return

      switch (data.type) {
        case 'editor:ready':
          setReady(true)
          if (Array.isArray(data.blocks)) setBlocks(data.blocks)
          break
        case 'editor:block_clicked':
          if (data.block_id) setSelectedBlockId(data.block_id)
          break
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const postToIframe = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*')
  }, [])

  const highlightBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
    postToIframe({ type: 'editor:highlight', block_id: blockId })
  }, [postToIframe])

  const scrollToBlock = useCallback((blockId: string) => {
    postToIframe({ type: 'editor:scroll', block_id: blockId })
  }, [postToIframe])

  const updateBlock = useCallback((blockId: string, content: string) => {
    postToIframe({ type: 'editor:update', block_id: blockId, content })
  }, [postToIframe])

  const setMeta = useCallback((title?: string, description?: string) => {
    postToIframe({ type: 'editor:set_meta', title, description })
  }, [postToIframe])

  const revert = useCallback(() => {
    postToIframe({ type: 'editor:revert' })
  }, [postToIframe])

  return {
    iframeRef,
    blocks,
    selectedBlockId,
    setSelectedBlockId,
    ready,
    highlightBlock,
    scrollToBlock,
    updateBlock,
    setMeta,
    revert,
  }
}

'use client'

import { useState, useCallback } from 'react'
import type { Media } from '@/lib/types'

// Re-export the BrandIdentity type from BrandPage
export type { BrandIdentity } from './BrandPage'

// Import the sub-components we need — they're defined in BrandPage
// Since they're not exported, we'll import the whole BrandPage module
// and use BrandPage with a forced 'guide' tab
// Actually simpler: just render BrandPage with guide-only mode

import { BrandPage, type BrandIdentity } from './BrandPage'

interface Props {
  identity: BrandIdentity
  media: Media[]
}

export function BrandGuidePage({ identity, media }: Props) {
  // Render BrandPage in guide-only mode (no tabs, no post studio)
  return <BrandPage identity={identity} media={media} placeId="" guideOnly />
}

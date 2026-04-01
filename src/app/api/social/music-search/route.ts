import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { getSocialConnections } from '@/lib/social'

const META_VERSION = 'v20.0'

export interface MusicTrack {
  id: string
  name: string
  artist: string
  duration_seconds: number
  preview_url: string | null
  isrc: string | null
}

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.length < 2) {
    return NextResponse.json({ tracks: [] })
  }

  const connections = await getSocialConnections()
  if (!connections.instagram.connected) {
    return NextResponse.json({ error: 'Instagram not connected' }, { status: 400 })
  }

  const { ig_user_id, page_access_token } = connections.instagram

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_VERSION}/${ig_user_id}/music_search?q=${encodeURIComponent(query)}&access_token=${page_access_token}`
    )
    const data = await res.json()

    if (data.error) {
      // If music_search is not available (needs Meta App Review), return helpful error
      if (data.error.code === 100 || data.error.code === 190) {
        return NextResponse.json({
          error: 'Music search requires Meta App Review. Submit your app for instagram_content_publish with music permissions.',
          tracks: [],
        })
      }
      return NextResponse.json({ error: data.error.message, tracks: [] })
    }

    const tracks: MusicTrack[] = (data.data ?? []).map((t: Record<string, unknown>) => ({
      id: t.id ?? '',
      name: t.name ?? t.title ?? 'Unknown',
      artist: t.artist_name ?? t.artist ?? 'Unknown Artist',
      duration_seconds: Number(t.duration_in_ms ?? 0) / 1000 || Number(t.duration ?? 0),
      preview_url: (t.preview_url as string) ?? null,
      isrc: (t.isrc as string) ?? null,
    }))

    return NextResponse.json({ tracks })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Music search failed', tracks: [] },
      { status: 500 }
    )
  }
}

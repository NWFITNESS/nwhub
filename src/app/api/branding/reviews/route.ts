import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const placeId: string = settingsData?.value?.google_place_id ?? ''

  if (!placeId) {
    return NextResponse.json({ error: 'No Google Place ID configured in Settings' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`
  const res = await fetch(url)
  const json = await res.json()

  if (json.status !== 'OK') {
    return NextResponse.json({ error: `Google API error: ${json.status}` }, { status: 502 })
  }

  const result = json.result
  return NextResponse.json({
    place_name: result.name ?? 'Northern Warrior Fitness',
    rating: result.rating ?? 0,
    total_reviews: result.user_ratings_total ?? 0,
    reviews: (result.reviews ?? []).map((r: {
      author_name: string
      rating: number
      text: string
      time: number
      relative_time_description: string
      profile_photo_url?: string
    }) => ({
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.time,
      relative_time_description: r.relative_time_description,
      profile_photo_url: r.profile_photo_url ?? '',
    })),
  })
}

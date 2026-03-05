import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ReviewSettings } from '@/lib/types'

export async function GET() {
  const supabase = createAdminClient()

  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings = settingsRow?.value as ReviewSettings | null
  if (!settings?.google_place_id) {
    return NextResponse.json({ error: 'Google Place ID is required in settings' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY env var not set' }, { status: 500 })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', settings.google_place_id)
  url.searchParams.set('fields', 'rating,user_ratings_total')
  url.searchParams.set('key', apiKey)

  const placesRes = await fetch(url.toString())
  const placesData = await placesRes.json()

  if (placesData.status !== 'OK') {
    return NextResponse.json(
      { error: `Google Places API error: ${placesData.status} — ${placesData.error_message ?? ''}` },
      { status: 400 }
    )
  }

  const { rating, user_ratings_total: currentCount } = placesData.result ?? {}
  const lastCount = settings.last_known_review_count ?? 0
  const delta = Math.max(0, (currentCount ?? 0) - lastCount)

  let newDetected = 0

  if (delta > 0) {
    const { data: candidates } = await supabase
      .from('review_requests')
      .select('id')
      .gt('messages_sent', 0)
      .eq('review_detected', false)
      .eq('opted_out', false)
      .order('last_sent_at', { ascending: false })
      .limit(delta)

    const ids = (candidates ?? []).map((r) => r.id)
    if (ids.length > 0) {
      await supabase
        .from('review_requests')
        .update({ review_detected: true })
        .in('id', ids)
      newDetected = ids.length
    }

    await supabase.from('global_settings').upsert(
      {
        key: 'review_settings',
        value: { ...settings, last_known_review_count: currentCount },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
  }

  return NextResponse.json({
    rating,
    total_reviews: currentCount,
    new_detected: newDetected,
    current_rating: rating,
  })
}

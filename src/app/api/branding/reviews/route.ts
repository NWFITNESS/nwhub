import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Get Place ID from settings
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const placeId: string = settingsData?.value?.google_place_id ?? ''
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // Fetch latest reviews from Google and upsert into DB
  if (placeId && apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 0 } })
      const json = await res.json()

      if (json.status === 'OK' && json.result?.reviews?.length) {
        const rows = (json.result.reviews as Array<{
          author_name: string
          rating: number
          text: string
          time: number
          relative_time_description: string
          profile_photo_url?: string
        }>).map((r) => ({
          id: `${r.author_name}_${r.time}`.replace(/[^a-z0-9]/gi, '_').slice(0, 80),
          author_name: r.author_name,
          rating: r.rating,
          text: r.text ?? '',
          review_time: r.time,
          relative_time: r.relative_time_description,
          profile_photo_url: r.profile_photo_url ?? '',
          synced_at: new Date().toISOString(),
        }))
        // Upsert — on conflict do nothing so we don't overwrite old entries
        await supabase.from('google_reviews').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
      }
    } catch {
      // Non-fatal — fall through and return from DB
    }
  }

  // Return all accumulated reviews from DB
  const { data: allReviews, error } = await supabase
    .from('google_reviews')
    .select('*')
    .order('review_time', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    reviews: (allReviews ?? []).map((r) => ({
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.review_time,
      relative_time_description: r.relative_time,
      profile_photo_url: r.profile_photo_url,
    })),
    total: allReviews?.length ?? 0,
  })
}

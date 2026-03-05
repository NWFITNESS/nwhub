import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')!

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings = settingsRow?.value as Record<string, unknown> | null
  if (!settings?.google_place_id) {
    return new Response(JSON.stringify({ error: 'google_place_id not set' }), { status: 400 })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', settings.google_place_id as string)
  url.searchParams.set('fields', 'rating,user_ratings_total')
  url.searchParams.set('key', googleApiKey)

  const placesRes = await fetch(url.toString())
  const placesData = await placesRes.json()

  if (placesData.status !== 'OK') {
    return new Response(JSON.stringify({ error: `Places API: ${placesData.status}` }), { status: 400 })
  }

  const { rating, user_ratings_total: currentCount } = placesData.result ?? {}
  const lastCount = (settings.last_known_review_count as number) ?? 0
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

    const ids = (candidates ?? []).map((r: { id: string }) => r.id)
    if (ids.length > 0) {
      await supabase.from('review_requests').update({ review_detected: true }).in('id', ids)
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

  return new Response(
    JSON.stringify({ rating, total_reviews: currentCount, new_detected: newDetected }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  const { businessId, title, body, url, type } = await request.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('business_id', businessId)

  const payload = JSON.stringify({ title, body, url, type })
  await Promise.allSettled(
    subs.map(({ subscription }) => webpush.sendNotification(subscription, payload))
  )
  return NextResponse.json({ sent: subs?.length || 0 })
}

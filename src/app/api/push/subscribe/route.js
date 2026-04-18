import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  const { subscription, businessId } = await request.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  await supabase.from('push_subscriptions').upsert({
    business_id: businessId,
    subscription,
    user_agent: request.headers.get('user-agent'),
  }, { onConflict: 'business_id' })
  return NextResponse.json({ success: true })
}

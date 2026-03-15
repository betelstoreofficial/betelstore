import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: orders, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch profiles for all unique user_ids
  const userIds = [...new Set((orders ?? []).map((o) => o.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  )

  const enriched = (orders ?? []).map((order) => ({
    ...order,
    customer: profileMap.get(order.user_id) ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const body = await request.json()

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'Order id and status required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const { orderId } = await params
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Fetch order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  // Fetch customer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('id', order.user_id)
    .single()

  return NextResponse.json({
    ...order,
    order_items: items ?? [],
    customer: profile ?? null,
  })
}

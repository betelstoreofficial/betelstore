import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()

  const [productsRes, ordersRes, revenueRes, pendingRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total').eq('payment_status', 'paid'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const revenue = (revenueRes.data ?? []).reduce(
    (sum: number, o: { total: number }) => sum + (o.total ?? 0),
    0,
  )

  return NextResponse.json({
    totalProducts: productsRes.count ?? 0,
    totalOrders: ordersRes.count ?? 0,
    revenue,
    pendingOrders: pendingRes.count ?? 0,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('mandi_rates')
    .select('*')
    .order('variety')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const body: { rates: { id: string; today_price: number }[] } = await request.json()

  if (!body.rates || !Array.isArray(body.rates)) {
    return NextResponse.json({ error: 'rates array required' }, { status: 400 })
  }

  // Fetch current rates to compute yesterday_price and change
  const { data: current, error: fetchError } = await supabase
    .from('mandi_rates')
    .select('*')

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const currentMap = new Map(
    (current ?? []).map((r) => [r.id, r]),
  )

  const errors: string[] = []
  for (const rate of body.rates) {
    const existing = currentMap.get(rate.id)
    if (!existing) {
      errors.push(`Rate ${rate.id} not found`)
      continue
    }

    const yesterdayPrice = existing.today_price
    const change = rate.today_price - yesterdayPrice

    const { error } = await supabase
      .from('mandi_rates')
      .update({
        today_price: rate.today_price,
        yesterday_price: yesterdayPrice,
        change,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rate.id)

    if (error) {
      errors.push(`Failed to update ${existing.variety}: ${error.message}`)
      continue
    }

    // Sync price back to the linked product
    if (existing.product_id) {
      const { error: productError } = await supabase
        .from('products')
        .update({ price_per_100: rate.today_price })
        .eq('id', existing.product_id)

      if (productError) {
        errors.push(`Failed to sync price to product ${existing.variety}: ${productError.message}`)
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

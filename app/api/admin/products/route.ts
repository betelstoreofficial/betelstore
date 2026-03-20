import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: body.name,
      origin: body.origin,
      grade: body.grade,
      price_per_100: body.price_per_100,
      bulk_price_per_1000: body.bulk_price_per_1000,
      bulk_min_qty: body.bulk_min_qty ?? 1000,
      unit: body.unit ?? 'leaves',
      available: body.available ?? true,
      description: body.description ?? '',
      tag: body.tag || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-create mandi rate entry for this product
  if (data) {
    await supabase
      .from('mandi_rates')
      .insert({
        product_id: data.id,
        variety: data.name,
        today_price: data.price_per_100,
        yesterday_price: data.price_per_100,
        change: 0,
      })
      .then(({ error: mandiError }) => {
        if (mandiError) console.error('Failed to create mandi rate:', mandiError)
      })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const body = await request.json()

  if (!body.id) {
    return NextResponse.json({ error: 'Product id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      name: body.name,
      origin: body.origin,
      grade: body.grade,
      price_per_100: body.price_per_100,
      bulk_price_per_1000: body.bulk_price_per_1000,
      bulk_min_qty: body.bulk_min_qty,
      unit: body.unit,
      available: body.available,
      description: body.description,
      tag: body.tag || null,
    })
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-update mandi rate variety name if product name changed
  if (data) {
    await supabase
      .from('mandi_rates')
      .update({ variety: data.name })
      .eq('product_id', data.id)
      .then(({ error: mandiError }) => {
        if (mandiError) console.error('Failed to update mandi rate name:', mandiError)
      })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Product id required' }, { status: 400 })
  }

  // Delete mandi rate first (linked via product_id, also cascades via FK)
  await supabase.from('mandi_rates').delete().eq('product_id', id)

  // Delete product
  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

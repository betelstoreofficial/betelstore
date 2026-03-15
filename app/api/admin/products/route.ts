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
      price_per_kg: body.price_per_kg,
      bulk_price_per_kg: body.bulk_price_per_kg,
      bulk_min_kg: body.bulk_min_kg ?? 20,
      unit: body.unit ?? 'kg',
      available: body.available ?? true,
      description: body.description ?? '',
      tag: body.tag || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      price_per_kg: body.price_per_kg,
      bulk_price_per_kg: body.bulk_price_per_kg,
      bulk_min_kg: body.bulk_min_kg,
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

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

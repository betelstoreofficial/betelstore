import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return auth.error

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (error) {
      console.error('[admin/products] GET query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/products] GET unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return auth.error

    const supabase = createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('products')
      .insert({
        id: crypto.randomUUID(),
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
        image_url: body.image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/products] POST error:', error)
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
  } catch (err) {
    console.error('[admin/products] POST unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return auth.error

    const supabase = createAdminClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Product id required' }, { status: 400 })
    }

    // Only include fields that were actually sent to avoid wiping data with undefined
    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.origin !== undefined) updates.origin = body.origin
    if (body.grade !== undefined) updates.grade = body.grade
    if (body.price_per_100 !== undefined) updates.price_per_100 = body.price_per_100
    if (body.bulk_price_per_1000 !== undefined) updates.bulk_price_per_1000 = body.bulk_price_per_1000
    if (body.bulk_min_qty !== undefined) updates.bulk_min_qty = body.bulk_min_qty
    if (body.unit !== undefined) updates.unit = body.unit
    if (body.available !== undefined) updates.available = body.available
    if (body.description !== undefined) updates.description = body.description
    if ('tag' in body) updates.tag = body.tag || null
    if ('image_url' in body) updates.image_url = body.image_url || null

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('[admin/products] PUT error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-sync mandi rate with product changes (name + price)
    if (data) {
      await supabase
        .from('mandi_rates')
        .update({
          variety: data.name,
          today_price: data.price_per_100,
        })
        .eq('product_id', data.id)
        .then(({ error: mandiError }) => {
          if (mandiError) console.error('Failed to update mandi rate:', mandiError)
        })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/products] PUT unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
      console.error('[admin/products] DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/products] DELETE unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

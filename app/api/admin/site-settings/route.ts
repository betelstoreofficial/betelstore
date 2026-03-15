import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-api'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()
  const body = await request.json()

  const { phone, email, whatsapp, address, business_hours_weekday, business_hours_weekend } = body

  if (!phone || !email || !whatsapp || !address || !business_hours_weekday || !business_hours_weekend) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  // Get the single row's id
  const { data: existing, error: fetchError } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Settings row not found' }, { status: 500 })
  }

  const { error } = await supabase
    .from('site_settings')
    .update({
      phone,
      email,
      whatsapp,
      address,
      business_hours_weekday,
      business_hours_weekend,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

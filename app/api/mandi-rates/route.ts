import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mandi_rates')
    .select('*')
    .order('variety')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Always derive the displayed change from today vs yesterday prices.
  // The stored `change` column can go stale when a row is edited outside
  // the admin rollover flow, so recompute it on every read.
  const rows = (data ?? []).map((r) => ({
    ...r,
    change:
      r.yesterday_price != null && r.today_price != null
        ? r.today_price - r.yesterday_price
        : (r.change ?? 0),
  }))

  return NextResponse.json(rows)
}

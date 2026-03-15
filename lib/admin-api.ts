import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

/**
 * Verify the current request is from an authenticated admin user.
 * Returns the user on success, or a NextResponse error on failure.
 */
export async function verifyAdmin(): Promise<
  | { user: { id: string; email: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!isAdminEmail(user.email)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user: { id: user.id, email: user.email! } }
}

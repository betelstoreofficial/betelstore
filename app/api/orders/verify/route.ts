import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentSuccessToUser } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

interface VerifyBody {
  orderId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 10 verify attempts per minute per user
    const { allowed, resetIn } = rateLimit(`verify:${user.id}`, { maxRequests: 10, windowSeconds: 60 })
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${resetIn} seconds.` },
        { status: 429 }
      )
    }

    const body: VerifyBody = await request.json()
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    // Verify HMAC-SHA256 signature
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const isValid = expectedSignature === razorpay_signature

    if (isValid) {
      // Payment verified — update order to processing + paid
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'processing',
          payment_status: 'paid',
          razorpay_payment_id,
        })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      // Send payment success email to user (non-blocking)
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (order) {
        sendPaymentSuccessToUser({
          orderId: order.id,
          orderNumber: order.order_number,
          items: order.items as { product_name: string; quantity: number; price_per_kg: number; is_bulk: boolean }[],
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          userEmail: user.email!,
          userName: user.user_metadata?.full_name || user.user_metadata?.name,
        }).catch(err => console.error('Failed to send payment success email:', err))
      }

      return NextResponse.json({ verified: true })
    } else {
      // Invalid signature — mark as failed
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
        })
        .eq('id', orderId)
        .eq('user_id', user.id)

      return NextResponse.json({ verified: false, error: 'Invalid payment signature' }, { status: 400 })
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

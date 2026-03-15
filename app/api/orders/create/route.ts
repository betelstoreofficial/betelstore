import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'

interface OrderItemInput {
  productId: string
  productName: string
  quantity: number
  pricePerKg: number
  isBulk: boolean
}

interface CreateOrderBody {
  items: OrderItemInput[]
  subtotal: number
  discount: number
  total: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateOrderBody = await request.json()
    const { items, subtotal, discount, total } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Build JSONB items array for the orders table
    const itemsJson = items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price_per_kg: item.pricePerKg,
      is_bulk: item.isBulk,
    }))

    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Create order in Supabase (pending status)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        items: itemsJson,
        subtotal: Math.round(subtotal),
        discount: Math.round(discount),
        total: Math.round(total),
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items in the order_items table
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price_per_kg: item.pricePerKg,
      is_bulk: item.isBulk,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
    }

    // Create Razorpay order (amount in paise)
    let razorpayOrder
    try {
      const razorpay = getRazorpay()
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total) * 100,
        currency: 'INR',
        receipt: order.id,
      })
    } catch (rzpError) {
      console.error('Razorpay order creation failed:', rzpError)
      return NextResponse.json({ error: 'Payment gateway error. Please check Razorpay configuration.' }, { status: 500 })
    }

    // Save razorpay_order_id back to order
    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id)

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error('[ORDER] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

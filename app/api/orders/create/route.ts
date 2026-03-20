import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRazorpay } from '@/lib/razorpay'
import { sendOrderConfirmationToUser, sendNewOrderAlertToAdmin } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

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

    // Rate limit: max 5 orders per minute per user
    const { allowed, resetIn } = rateLimit(`order:${user.id}`, { maxRequests: 5, windowSeconds: 60 })
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${resetIn} seconds.` },
        { status: 429 }
      )
    }

    const body: CreateOrderBody = await request.json()
    const { items } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Validate quantities
    for (const item of items) {
      if (!item.productId || item.quantity <= 0) {
        return NextResponse.json({ error: 'Invalid item data' }, { status: 400 })
      }
    }

    // Fetch actual product prices from database (NEVER trust client prices)
    const productIds = items.map(item => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price_per_kg, bulk_price_per_kg, bulk_min_kg, available')
      .in('id', productIds)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Verify all products exist and are available
    const productMap = new Map(products.map(p => [p.id, p]))
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 })
      }
      if (!product.available) {
        return NextResponse.json({ error: `Product unavailable: ${product.name}` }, { status: 400 })
      }
    }

    // Calculate prices server-side using database values
    let serverSubtotal = 0
    let serverDiscount = 0

    const itemsJson = items.map(item => {
      const product = productMap.get(item.productId)!
      const isBulkEligible = item.isBulk && item.quantity >= product.bulk_min_kg
      const effectivePrice = isBulkEligible ? product.bulk_price_per_kg : product.price_per_kg
      const itemTotal = product.price_per_kg * item.quantity

      serverSubtotal += itemTotal
      if (isBulkEligible) {
        serverDiscount += (product.price_per_kg - product.bulk_price_per_kg) * item.quantity
      }

      return {
        product_id: item.productId,
        product_name: product.name,
        quantity: item.quantity,
        price_per_kg: Number(effectivePrice),
        is_bulk: isBulkEligible,
      }
    })

    const serverTotal = serverSubtotal - serverDiscount

    // Sanity check — reject if total is zero or negative
    if (serverTotal <= 0) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 })
    }

    // Generate a unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // Create order in Supabase using SERVER-CALCULATED values
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        items: itemsJson,
        subtotal: Math.round(serverSubtotal),
        discount: Math.round(serverDiscount),
        total: Math.round(serverTotal),
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
    const orderItems = itemsJson.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price_per_kg: item.price_per_kg,
      is_bulk: item.is_bulk,
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
        amount: Math.round(serverTotal) * 100,
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

    // Send email notifications (non-blocking)
    const emailData = {
      orderId: order.id,
      orderNumber: order.order_number,
      items: itemsJson,
      subtotal: Math.round(serverSubtotal),
      discount: Math.round(serverDiscount),
      total: Math.round(serverTotal),
      userEmail: user.email!,
      userName: user.user_metadata?.full_name || user.user_metadata?.name,
    }

    sendOrderConfirmationToUser(emailData).catch(err => console.error('Failed to send order confirmation email:', err))
    sendNewOrderAlertToAdmin(emailData).catch(err => console.error('Failed to send admin alert email:', err))

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

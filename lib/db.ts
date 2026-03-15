import { createClient } from '@/lib/supabase/client'

function getSupabase() {
  return createClient()
}

export interface Product {
  id: string
  name: string
  origin: string
  grade: string
  price_per_kg: number
  bulk_price_per_kg: number
  bulk_min_kg: number
  unit: string
  available: boolean
  description: string
  tag?: string | null
  created_at?: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  items: unknown[]
  subtotal: number
  discount: number
  total: number
  status: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
  payment_status?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price_per_kg: number
  is_bulk: boolean
  created_at: string
}

export async function getProducts(): Promise<Product[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function getOrders(userId: string): Promise<Order[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data || []
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    console.error('Error fetching order items:', error)
    return []
  }

  return data || []
}

export interface CreateOrderResponse {
  orderId: string
  razorpayOrderId: string
  keyId: string
  amount: number
  currency: string
}

export async function createOrder(
  items: { productId: string; productName: string; quantity: number; pricePerKg: number; isBulk: boolean }[],
  subtotal: number,
  discount: number,
  total: number
): Promise<CreateOrderResponse> {
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, subtotal, discount, total }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to create order')
  }

  return res.json()
}

export async function verifyPayment(body: {
  orderId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<{ verified: boolean }> {
  const res = await fetch('/api/orders/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Payment verification failed')
  }

  return res.json()
}

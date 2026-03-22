"use client"

import { useState, useEffect } from "react"
import { Package, ChevronRight, X, Leaf, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { getOrders, getOrderItems, type Order, type OrderItem } from "@/lib/db"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  processing: {
    label: "Processing",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  shipped: {
    label: "Shipped",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  delivered: {
    label: "Delivered",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Awaiting Payment",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  paid: {
    label: "Paid",
    className: "bg-success/10 text-success border-success/20",
  },
  failed: {
    label: "Payment Failed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    async function loadOrders() {
      if (user?.id) {
        const data = await getOrders(user.id)
        setOrders(data)
      }
      setLoading(false)
    }
    loadOrders()
  }, [user])

  // Load order items when order is selected
  useEffect(() => {
    async function loadOrderItems() {
      if (selectedOrder && !orderItems[selectedOrder.id]) {
        const items = await getOrderItems(selectedOrder.id)
        setOrderItems(prev => ({ ...prev, [selectedOrder.id]: items }))
      }
    }
    loadOrderItems()
  }, [selectedOrder, orderItems])

  const selectedItems = selectedOrder ? (orderItems[selectedOrder.id] || []) : []

  // Show loading while auth checks (middleware handles redirect)
  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 ">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
            Order History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your wholesale orders
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">No orders yet</h2>
          <p className="text-muted-foreground mt-2">Start shopping to see your orders here</p>
          <a href="/">
            <Button className="mt-4">Browse Products</Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6 ">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
          Order History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage your wholesale orders
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Orders List */}
        <div className="flex-1">
          <div className="flex flex-col gap-3">
            {orders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig.pending
              const paymentConfig = paymentStatusConfig[order.payment_status || 'pending'] || paymentStatusConfig.pending
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md active:bg-accent/50",
                    selectedOrder?.id === order.id && "border-primary ring-1 ring-primary/20"
                  )}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/40">
                    <Package className="h-5 w-5 text-primary/60" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-card-foreground">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-semibold", config.className)}
                      >
                        {config.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-semibold", paymentConfig.className)}
                      >
                        {paymentConfig.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-card-foreground">
                      {"\u20B9"}{(order.total || 0).toLocaleString("en-IN")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Order Detail Panel */}
        {selectedOrder && (
          <aside
            key={selectedOrder.id}
            className="h-fit rounded-xl border border-border bg-card p-5 lg:w-96"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-card-foreground">
                {selectedOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
                aria-label="Close order details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  statusConfig[selectedOrder.status]?.className || statusConfig.pending.className
                )}
              >
                {statusConfig[selectedOrder.status]?.label || "Pending"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold",
                  (paymentStatusConfig[selectedOrder.payment_status || 'pending'] || paymentStatusConfig.pending).className
                )}
              >
                {(paymentStatusConfig[selectedOrder.payment_status || 'pending'] || paymentStatusConfig.pending).label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(selectedOrder.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <Separator className="my-4" />

            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Items</h3>
            <div className="flex flex-col gap-3">
              {selectedItems.length > 0 ? (
                selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/40">
                      <Leaf className="h-5 w-5 text-primary/30" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity.toLocaleString("en-IN")} leaves × {"\u20B9"}{item.price_per_unit.toLocaleString("en-IN")}/100
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-card-foreground">
                      {"\u20B9"}{((item.quantity * item.price_per_unit) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Loading items...</p>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{"\u20B9"}{(selectedOrder.total || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span className="font-medium text-success">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-card-foreground">
                <span>Total</span>
                <span>{"\u20B9"}{(selectedOrder.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {selectedOrder.status === "processing" && (
              <Button variant="outline" className="mt-5 w-full text-destructive hover:text-destructive">
                Cancel Order
              </Button>
            )}

            {selectedOrder.status === "delivered" && (
              <Button className="mt-5 w-full">
                Reorder
              </Button>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface OrderCustomer {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

interface OrderItem {
  product_name: string
  quantity: number
  price_per_unit: number
  is_bulk: boolean
}

interface Order {
  id: string
  order_number: string
  user_id: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  status: string
  payment_status: string
  created_at: string
  customer: OrderCustomer | null
  order_items?: OrderItem[]
}

const statusOptions = ["all", "pending", "processing", "shipped", "delivered", "cancelled"]
const orderStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"]

function statusColor(status: string) {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800"
    case "processing": return "bg-blue-100 text-blue-800"
    case "shipped": return "bg-purple-100 text-purple-800"
    case "delivered": return "bg-green-100 text-green-800"
    case "cancelled": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

function paymentColor(status: string) {
  switch (status) {
    case "paid": return "bg-green-100 text-green-800"
    case "pending": return "bg-yellow-100 text-yellow-800"
    case "failed": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    const url = statusFilter === "all"
      ? "/api/admin/orders"
      : `/api/admin/orders?status=${statusFilter}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function openDetail(order: Order) {
    setSelectedOrder(order)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`)
      const data = await res.json()
      setSelectedOrder(data)
    } catch {
      // keep basic order data
    } finally {
      setDetailLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    if (!selectedOrder) return
    setUpdatingStatus(true)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedOrder.id, status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(`Order status updated to ${newStatus}`)
      setSelectedOrder({ ...selectedOrder, status: newStatus })
      fetchOrders()
    } catch {
      toast.error("Failed to update order status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">Orders</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead className="hidden sm:table-cell">Customer</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => openDetail(order)}
                >
                  <TableCell className="font-medium font-mono text-xs">
                    {order.order_number || order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {order.customer?.full_name || order.customer?.email || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {"\u20B9"}{order.total?.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" className={paymentColor(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Order {selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Customer</h4>
                <p className="text-sm">{selectedOrder.customer?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.customer?.email}</p>
                {selectedOrder.customer?.phone && (
                  <p className="text-xs text-muted-foreground">{selectedOrder.customer.phone}</p>
                )}
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Items</h4>
                {detailLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="space-y-2">
                    {(selectedOrder.order_items ?? selectedOrder.items ?? []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="ml-2 text-muted-foreground">
                            {item.quantity.toLocaleString("en-IN")} leaves @ {"\u20B9"}{item.price_per_unit}/100
                          </span>
                          {item.is_bulk && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">Bulk</Badge>
                          )}
                        </div>
                        <span className="font-medium">
                          {"\u20B9"}{((item.quantity * item.price_per_unit) / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{"\u20B9"}{selectedOrder.subtotal?.toLocaleString("en-IN")}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{"\u20B9"}{selectedOrder.discount?.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{"\u20B9"}{selectedOrder.total?.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <Separator />

              {/* Status + Payment */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="mb-1 text-xs font-semibold text-muted-foreground">Payment</h4>
                  <Badge variant="secondary" className={paymentColor(selectedOrder.payment_status)}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-xs font-semibold text-muted-foreground">Update Status</h4>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={updateStatus}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Ordered on{" "}
                {new Date(selectedOrder.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

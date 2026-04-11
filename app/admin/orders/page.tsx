"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

type SortKey = "order_number" | "customer" | "created_at" | "total" | "status" | "payment_status"
type SortDir = "asc" | "desc"

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

function sortOrders(orders: Order[], key: SortKey, dir: SortDir): Order[] {
  return [...orders].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case "order_number":
        cmp = (a.order_number || a.id).localeCompare(b.order_number || b.id)
        break
      case "customer":
        cmp = (a.customer?.full_name || a.customer?.email || "").localeCompare(
          b.customer?.full_name || b.customer?.email || ""
        )
        break
      case "created_at":
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        break
      case "total":
        cmp = (a.total || 0) - (b.total || 0)
        break
      case "status":
        cmp = a.status.localeCompare(b.status)
        break
      case "payment_status":
        cmp = a.payment_status.localeCompare(b.payment_status)
        break
    }
    return dir === "asc" ? cmp : -cmp
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    const url = statusFilter === "all"
      ? "/api/admin/orders"
      : `/api/admin/orders?status=${statusFilter}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : [])
        setSelected(new Set())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const sortedOrders = sortOrders(orders, sortKey, sortDir)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === sortedOrders.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sortedOrders.map((o) => o.id)))
    }
  }

  async function deleteOrders(ids: string[]) {
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }
      toast.success(`Deleted ${ids.length} order(s)`)
      fetchOrders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete orders")
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

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

  function SortHeader({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) {
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={() => handleSort(sortKeyName)}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {label}
          <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyName ? "text-foreground" : "text-muted-foreground/50"}`} />
        </button>
      </TableHead>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">Orders</h2>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirm(Array.from(selected))}
              disabled={deleting}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete ({selected.size})
            </Button>
          )}
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
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={sortedOrders.length > 0 && selected.size === sortedOrders.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all orders"
                />
              </TableHead>
              <SortHeader label="Order #" sortKeyName="order_number" />
              <SortHeader label="Customer" sortKeyName="customer" className="hidden sm:table-cell" />
              <SortHeader label="Date" sortKeyName="created_at" className="hidden md:table-cell" />
              <SortHeader label="Total" sortKeyName="total" className="text-right" />
              <SortHeader label="Status" sortKeyName="status" />
              <SortHeader label="Payment" sortKeyName="payment_status" className="hidden lg:table-cell" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={`transition-colors hover:bg-accent/50 ${selected.has(order.id) ? "bg-accent/30" : ""}`}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                      aria-label={`Select order ${order.order_number}`}
                    />
                  </TableCell>
                  <TableCell
                    className="font-medium font-mono text-xs cursor-pointer"
                    onClick={() => openDetail(order)}
                  >
                    {order.order_number || order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell
                    className="hidden sm:table-cell cursor-pointer"
                    onClick={() => openDetail(order)}
                  >
                    {order.customer?.full_name || order.customer?.email || "—"}
                  </TableCell>
                  <TableCell
                    className="hidden md:table-cell text-muted-foreground cursor-pointer"
                    onClick={() => openDetail(order)}
                  >
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell
                    className="text-right font-medium tabular-nums cursor-pointer"
                    onClick={() => openDetail(order)}
                  >
                    {"\u20B9"}{order.total?.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => openDetail(order)}>
                    <Badge variant="secondary" className={statusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="hidden lg:table-cell cursor-pointer"
                    onClick={() => openDetail(order)}
                  >
                    <Badge variant="secondary" className={paymentColor(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteConfirm([order.id])}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirm?.length === 1 ? "order" : `${deleteConfirm?.length} orders`}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteConfirm?.length === 1 ? "order" : "orders"} and all associated items from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteOrders(deleteConfirm)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

              <div className="flex items-center justify-between">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedOrder(null)
                    setDeleteConfirm([selectedOrder.id])
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

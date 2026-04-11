"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Leaf, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { createOrder, verifyPayment } from "@/lib/db"
import { proxyImageUrl } from "@/lib/utils"
import { getDeliveryInfo } from "@/lib/delivery"

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, discount, total } = useCart()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [placing, setPlacing] = useState(false)
  const delivery = getDeliveryInfo()
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve()
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"))
      document.body.appendChild(script)
    })
  }

  async function handlePlaceOrder() {
    if (authLoading) {
      toast.info("Please wait, checking authentication...")
      return
    }
    if (!user) {
      toast.info("Please sign in to place your order")
      router.push("/auth/login?redirectTo=/cart")
      return
    }

    if (items.length === 0) return

    setPlacing(true)
    try {
      const orderItems = items.map((item) => {
        const isBulkActive = item.isBulk && item.quantity >= item.product.bulk_min_qty
        const bulkPricePer100 = item.product.bulk_price_per_1000 / 10
        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          pricePerUnit: isBulkActive ? bulkPricePer100 : item.product.price_per_100,
          isBulk: isBulkActive,
        }
      })

      const { orderId, razorpayOrderId, keyId, amount, currency } = await createOrder(
        orderItems,
        subtotal,
        discount,
        total
      )

      await loadRazorpayScript()

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "The Betel Store",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const result = await verifyPayment({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            if (result.verified) {
              clearCart()
              toast.success("Payment successful!", {
                description: "Your order has been confirmed.",
              })
              router.push("/orders")
            } else {
              toast.error("Payment verification failed", {
                description: "Please contact support.",
              })
            }
          } catch {
            toast.error("Payment verification failed", {
              description: "Please contact support.",
            })
          } finally {
            setPlacing(false)
          }
        },
        modal: {
          ondismiss: async () => {
            setPlacing(false)
            // Cancel the pending order since payment was not completed
            try {
              await fetch("/api/orders/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId,
                  razorpay_order_id: razorpayOrderId,
                  razorpay_payment_id: "",
                  razorpay_signature: "",
                }),
              })
            } catch {}
            toast.info("Payment cancelled", {
              description: "Your order has been cancelled. Please try again when ready.",
            })
          },
        },
        theme: {
          color: "#1a5c2a",
        },
      })

      rzp.open()
    } catch {
      setPlacing(false)
      toast.error("Failed to place order", {
        description: "Something went wrong. Please try again.",
      })
    }
  }

  function handleDeleteConfirm() {
    if (deleteItemId) {
      removeItem(deleteItemId)
      setDeleteItemId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="flex flex-col items-center gap-6 py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground">
              Your cart is empty
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse our betel leaf varieties and add items to get started.
            </p>
          </div>
          <Button asChild>
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
            Your Cart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(true)} className="text-destructive hover:text-destructive">
          Clear all
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1">
          {items.map((item) => {
            const isBulkActive = item.isBulk && item.quantity >= (item.product.bulk_min_qty || 0)
            const bulkPricePer100 = (item.product.bulk_price_per_1000 || 0) / 10
            const effectivePrice = isBulkActive ? bulkPricePer100 : (item.product.price_per_100 || 0)
            const itemTotal = (effectivePrice * item.quantity) / 100
            const step = 100

            return (
              <div
                key={item.product.id}
                className="mb-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent/40">
                    {item.product.image_url ? (
                      <Image
                        src={proxyImageUrl(item.product.image_url)!}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <Leaf className="h-8 w-8 text-primary/30" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold text-card-foreground">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.product.origin} &middot; {item.product.grade}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteItemId(item.product.id)}
                        className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:bg-destructive/10"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, Math.max(step, item.quantity - step))}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-l-lg text-muted-foreground transition-all hover:bg-secondary active:bg-secondary active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex w-12 items-center justify-center text-sm font-semibold text-card-foreground tabular-nums">
                          {item.quantity.toLocaleString("en-IN")}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + step)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground transition-all hover:bg-secondary active:bg-secondary active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">leaves</span>

                      <div className="ml-auto text-right">
                        <p className="text-sm font-bold text-card-foreground tabular-nums">
                          {"\u20B9"}{itemTotal.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {"\u20B9"}{effectivePrice.toLocaleString("en-IN")}/100
                        </p>
                      </div>
                    </div>

                    {isBulkActive && (
                      <div className="rounded-lg bg-success/10 px-3 py-1.5 text-[11px] font-medium text-success">
                        Bulk pricing applied &mdash; saving {"\u20B9"}
                        {(((item.product.price_per_100 - bulkPricePer100) * item.quantity) / 100).toLocaleString("en-IN")}
                      </div>
                    )}

                    {item.isBulk && item.quantity < item.product.bulk_min_qty && (
                      <div className="rounded-lg bg-warning/10 px-3 py-1.5 text-[11px] font-medium text-warning-foreground">
                        Add {(item.product.bulk_min_qty - item.quantity).toLocaleString("en-IN")} more leaves for bulk pricing
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm lg:w-80">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-card-foreground">
            Order Summary
          </h2>

          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{"\u20B9"}{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Bulk Discount</span>
                <span className="tabular-nums">-{"\u20B9"}{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex flex-col gap-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-medium text-primary">{delivery.label}</span>
              </div>
              <p className="text-xs text-muted-foreground/70">{delivery.feeNote}</p>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold text-card-foreground">
              <span>Total</span>
              <span className="tabular-nums">{"\u20B9"}{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Button
            className="mt-5 w-full shadow-lg shadow-primary/20"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              "Place Order"
            )}
          </Button>

          <Button variant="ghost" className="mt-2 w-full" asChild>
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </aside>
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { clearCart(); setShowClearConfirm(false) }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

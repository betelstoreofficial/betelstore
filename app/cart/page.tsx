"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Leaf, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { createOrder, verifyPayment } from "@/lib/db"

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, discount, total } = useCart()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [placing, setPlacing] = useState(false)

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
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        pricePerKg:
          item.isBulk && item.quantity >= item.product.bulk_min_kg
            ? item.product.bulk_price_per_kg
            : item.product.price_per_kg,
        isBulk: item.isBulk && item.quantity >= item.product.bulk_min_kg,
      }))

      // 1. Create order + Razorpay order via API
      const { orderId, razorpayOrderId, keyId, amount, currency } = await createOrder(
        orderItems,
        subtotal,
        discount,
        total
      )

      // 2. Load Razorpay checkout script
      await loadRazorpayScript()

      // 3. Open Razorpay checkout modal
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "Betel Wholesale",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Verify payment signature
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
          ondismiss: () => {
            setPlacing(false)
            toast.info("Payment cancelled", {
              description: "Your order has been saved. You can pay later from your orders.",
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

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="flex animate-in fade-in zoom-in-95 flex-col items-center gap-6 py-20 duration-300">
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
            <Link href="/">
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
      <div className="mb-6 flex animate-in fade-in slide-in-from-top-2 items-center justify-between duration-300">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
            Your Cart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
          Clear all
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1">
          {items.map((item, index) => {
            const effectivePrice =
              item.isBulk && item.quantity >= item.product.bulk_min_kg
                ? item.product.bulk_price_per_kg
                : item.product.price_per_kg
            const itemTotal = effectivePrice * item.quantity
            const isBulkActive = item.isBulk && item.quantity >= item.product.bulk_min_kg

            return (
              <div
                key={item.product.id}
                style={{ animationDelay: `${50 * index}ms` }}
                className="mb-3 animate-in fade-in slide-in-from-left-4 rounded-xl border border-border bg-card p-4 fill-mode-both duration-300"
              >
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-accent/40">
                    <Leaf className="h-8 w-8 text-primary/30" />
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
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
                        onClick={() => removeItem(item.product.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border border-border">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-secondary"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex w-12 items-center justify-center text-sm font-semibold text-card-foreground">
                          {item.quantity} kg
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-secondary"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-card-foreground">
                          {"\u20B9"}{itemTotal.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {"\u20B9"}{effectivePrice.toLocaleString("en-IN")}/kg
                        </p>
                      </div>
                    </div>

                    {isBulkActive && (
                      <div className="rounded-lg bg-success/10 px-3 py-1.5 text-[11px] font-medium text-success">
                        Bulk pricing applied &mdash; saving {"\u20B9"}
                        {((item.product.price_per_kg - item.product.bulk_price_per_kg) * item.quantity).toLocaleString("en-IN")}
                      </div>
                    )}

                    {item.isBulk && item.quantity < item.product.bulk_min_kg && (
                      <div className="rounded-lg bg-warning/10 px-3 py-1.5 text-[11px] font-medium text-warning-foreground">
                        Add {item.product.bulk_min_kg - item.quantity} more kg for bulk pricing
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <aside className="h-fit animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-border bg-card p-5 duration-400 lg:w-80">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-card-foreground">
            Order Summary
          </h2>

          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{"\u20B9"}{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <span>Bulk Discount</span>
                <span>-{"\u20B9"}{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span className="font-medium text-success">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold text-card-foreground">
              <span>Total</span>
              <span>{"\u20B9"}{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Button
            className="mt-5 w-full"
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
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}

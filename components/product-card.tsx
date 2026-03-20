"use client"

import { useState, useCallback } from "react"
import { Plus, Minus, ShoppingCart, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/lib/db"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
  index: number
}

export function ProductCard({ product, index }: ProductCardProps) {
  const [quantity, setQuantity] = useState(100)
  const [isBulk, setIsBulk] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  // quantity is in leaves; price_per_100 is per 100 leaves; bulk_price_per_1000 is per 1000 leaves
  const currentPrice = isBulk ? product.bulk_price_per_1000 : product.price_per_100
  const priceLabel = isBulk ? "per 1000 leaves" : "per 100 leaves"
  const savings = isBulk
    ? (product.price_per_100 * 10 - product.bulk_price_per_1000) * (quantity / 1000)
    : 0
  const savingsPerUnit = product.price_per_100 * 10 - product.bulk_price_per_1000

  // quantity step: 100 for daily, 1000 for bulk
  const step = isBulk ? 1000 : 100
  const minQty = isBulk ? product.bulk_min_qty : 100

  // Reset quantity when switching modes
  const handleModeSwitch = (bulk: boolean) => {
    setIsBulk(bulk)
    setQuantity(bulk ? product.bulk_min_qty : 100)
  }

  const handleAdd = useCallback(() => {
    addItem(product, quantity, isBulk)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      setQuantity(isBulk ? product.bulk_min_qty : 100)
    }, 600)
  }, [addItem, product, quantity, isBulk])

  // Calculate total for display
  const itemTotal = isBulk
    ? (product.bulk_price_per_1000 * quantity) / 1000
    : (product.price_per_100 * quantity) / 100

  return (
    <article
      style={{ animationDelay: `${60 * index}ms` }}
      className={cn(
        "group relative flex animate-in fade-in slide-in-from-bottom-4 flex-col overflow-hidden rounded-xl border border-border bg-card fill-mode-both transition-shadow duration-300 hover:shadow-lg",
        !product.available && "opacity-60"
      )}
    >
      {product.tag && (
        <div className="absolute right-3 top-3 z-10">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-semibold",
              product.tag === "Best Seller" && "bg-primary text-primary-foreground",
              product.tag === "Premium" && "bg-warning text-warning-foreground",
              product.tag === "New Arrival" && "bg-success text-success-foreground"
            )}
          >
            {product.tag}
          </Badge>
        </div>
      )}

      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/15 via-accent/40 to-emerald-200/30">
        <Leaf className="h-16 w-16 text-primary/40 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/60" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-base font-bold text-card-foreground">
            {product.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {product.origin} &middot; {product.grade}
          </p>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto flex flex-col gap-3">
          {/* Pricing Toggle */}
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-1">
            <button
              onClick={() => handleModeSwitch(false)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                !isBulk
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Daily
            </button>
            <button
              onClick={() => handleModeSwitch(true)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                isBulk
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Bulk ({"\u2265"}{product.bulk_min_qty.toLocaleString("en-IN")} leaves)
            </button>
          </div>

          {/* Price Display */}
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-card-foreground">
              {"\u20B9"}{currentPrice.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-muted-foreground">{priceLabel}</span>
            {isBulk && savingsPerUnit > 0 && (
              <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Save {"\u20B9"}{savingsPerUnit.toLocaleString("en-IN")}/1000
              </span>
            )}
          </div>

          {/* Quantity + Add */}
          {product.available ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border">
                <button
                  onClick={() => setQuantity(Math.max(minQty, quantity - step))}
                  className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-secondary"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="flex w-14 items-center justify-center text-sm font-semibold text-card-foreground">
                  {quantity.toLocaleString("en-IN")}
                </span>
                <button
                  onClick={() => setQuantity(quantity + step)}
                  className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-secondary"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">leaves</span>
              <Button
                onClick={handleAdd}
                size="sm"
                className={cn("ml-auto gap-1.5", added && "bg-success text-success-foreground")}
                disabled={added}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {added ? "Added!" : "Add"}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary py-2 text-center text-xs font-medium text-muted-foreground">
              Currently Unavailable
            </div>
          )}

          {savings > 0 && (
            <p className="text-xs font-medium text-success">
              You save {"\u20B9"}{savings.toLocaleString("en-IN")} on this order
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

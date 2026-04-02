"use client"

import { useState, useCallback } from "react"
import { Plus, Minus, ShoppingCart, Leaf, Check, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const { addItem } = useCart()

  // Auto-apply bulk pricing when quantity reaches bulk_min_qty
  const bulkEligible = quantity >= product.bulk_min_qty
  const effectiveBulk = isBulk || bulkEligible
  const currentPrice = effectiveBulk ? product.bulk_price_per_1000 : product.price_per_100
  const priceLabel = effectiveBulk ? "per 1000 leaves" : "per 100 leaves"
  const bulkPricePer100 = product.bulk_price_per_1000 / 10
  const savings = effectiveBulk
    ? ((product.price_per_100 - bulkPricePer100) * quantity) / 100
    : 0
  const savingsPerUnit = product.price_per_100 * 10 - product.bulk_price_per_1000

  const step = 100
  const minQty = isBulk ? product.bulk_min_qty : 100

  const handleModeSwitch = (bulk: boolean) => {
    setIsBulk(bulk)
    setQuantity(bulk ? product.bulk_min_qty : 100)
  }

  const handleAdd = useCallback(() => {
    addItem(product, quantity, effectiveBulk)
    setAdded(true)
    toast.success(`${product.name} added to cart`, {
      action: {
        label: "View Cart",
        onClick: () => window.location.href = "/cart",
      },
    })
    setTimeout(() => {
      setAdded(false)
      setQuantity(isBulk ? product.bulk_min_qty : 100)
    }, 1500)
  }, [addItem, product, quantity, isBulk, effectiveBulk])

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg",
        !product.available && "opacity-60"
      )}
    >
      {product.tag && product.tag !== "none" && (
        <div className="absolute right-3 top-3 z-10">
          <Badge
            className={cn(
              "text-xs font-semibold shadow-md backdrop-blur-sm",
              product.tag === "Best Seller" && "bg-sky-800/90 text-white border-0",
              product.tag === "Premium" && "bg-indigo-800/90 text-white border-0",
              product.tag === "New Arrival" && "bg-amber-950/90 text-white border-0"
            )}
          >
            {product.tag}
          </Badge>
        </div>
      )}

      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-accent/40 to-emerald-200/30",
          product.image_url && "cursor-pointer"
        )}
        onClick={() => product.image_url && setLightboxOpen(true)}
        role={product.image_url ? "button" : undefined}
        tabIndex={product.image_url ? 0 : undefined}
        aria-label={product.image_url ? `View ${product.name} image` : undefined}
        onKeyDown={(e) => {
          if (product.image_url && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            setLightboxOpen(true)
          }
        }}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <Leaf className="h-16 w-16 text-primary/40" />
        )}
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
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-1" role="group" aria-label="Pricing mode">
            <button
              type="button"
              onClick={() => handleModeSwitch(false)}
              aria-pressed={!isBulk}
              className={cn(
                "flex-1 cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-all",
                !isBulk
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch(true)}
              aria-pressed={isBulk}
              className={cn(
                "flex-1 cursor-pointer rounded-md px-3 py-2 text-xs font-medium transition-all",
                isBulk
                  ? "bg-card text-card-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Bulk ({"\u2265"}{product.bulk_min_qty.toLocaleString("en-IN")} leaves)
            </button>
          </div>

          {/* Price Display - fixed height to prevent layout shift */}
          <div className="flex h-8 items-baseline gap-2">
            <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-card-foreground">
              {"\u20B9"}{currentPrice.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-muted-foreground">{priceLabel}</span>
            {effectiveBulk && savingsPerUnit > 0 && (
              <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                Save {"\u20B9"}{savingsPerUnit.toLocaleString("en-IN")}/1000
              </span>
            )}
          </div>

          {/* Quantity + Add */}
          {product.available ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(minQty, quantity - step))}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex w-14 items-center justify-center text-sm font-semibold text-card-foreground tabular-nums">
                  {quantity.toLocaleString("en-IN")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newQty = quantity + step
                    setQuantity(newQty)
                    if (newQty >= product.bulk_min_qty && !isBulk) setIsBulk(true)
                  }}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-secondary active:bg-secondary"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">leaves</span>
              <Button
                onClick={handleAdd}
                size="sm"
                className={cn("ml-auto gap-1.5 min-w-[80px]", added && "bg-success text-success-foreground")}
                disabled={added}
              >
                {added ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary py-2 text-center text-xs font-medium text-muted-foreground">
              Currently Unavailable
            </div>
          )}

          {/* Savings text - fixed height so card doesn't shift */}
          <div className="h-4">
            {savings > 0 && (
              <p className="text-xs font-medium text-success">
                You save {"\u20B9"}{savings.toLocaleString("en-IN")} on this order
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Image Lightbox */}
      {product.image_url && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent showCloseButton={false} className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none sm:max-w-[90vw]">
            <DialogTitle className="sr-only">{product.name}</DialogTitle>
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card text-card-foreground shadow-lg transition-colors hover:bg-secondary"
                aria-label="Close image"
              >
                <X className="h-4 w-4" />
              </button>
              <Image
                src={product.image_url}
                alt={product.name}
                width={800}
                height={800}
                className="max-h-[85vh] w-auto rounded-xl object-contain"
                sizes="90vw"
                priority
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </article>
  )
}

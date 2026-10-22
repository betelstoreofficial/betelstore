"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Product } from "@/lib/db"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

import { isCalcutta, quantityRules, normalizeQuantity, bulkActive, linePricing } from "@/lib/product-units"

interface CartItem {
  product: Product
  quantity: number
  isBulk: boolean
  unitsVersion?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity: number, isBulk: boolean) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
  discount: number
  total: number
}

const CART_STORAGE_KEY_PREFIX = "betel-cart"

function getCartKey(userId: string | null): string {
  return userId ? `${CART_STORAGE_KEY_PREFIX}-${userId}` : `${CART_STORAGE_KEY_PREFIX}-guest`
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [currentCartKey, setCurrentCartKey] = useState<string | null>(null)

  // Load cart when user changes (login/logout)
  useEffect(() => {
    if (authLoading) return

    const cartKey = getCartKey(user?.id ?? null)

    // If same key, don't reload
    if (cartKey === currentCartKey) return

    try {
      const stored = localStorage.getItem(cartKey)
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored)
        if (parsed.some(i => i.product && isCalcutta(i.product) && i.unitsVersion !== 2)) toast.info("Calcutta is now sold by bharti. Please re-add Calcutta items to confirm the new quantity and price.")
        const validItems = parsed.filter((i) => i.product && i.product.id && typeof i.product.price_per_100 === "number" && (!isCalcutta(i.product) || i.unitsVersion === 2)).map(i => ({ ...i, quantity: normalizeQuantity(i.product, i.quantity) }))
        if (validItems.length > 0) {
          setItems(validItems)
        } else if (user?.id) {
          // User cart exists but is empty/invalid, try guest cart
          const guestCart = localStorage.getItem(getCartKey(null))
          if (guestCart) {
            const guestItems: CartItem[] = JSON.parse(guestCart)
            const validGuestItems = guestItems.filter((i) => i.product && i.product.id && typeof i.product.price_per_100 === "number" && (!isCalcutta(i.product) || i.unitsVersion === 2)).map(i => ({ ...i, quantity: normalizeQuantity(i.product, i.quantity) }))
            if (validGuestItems.length > 0) {
              setItems(validGuestItems)
              localStorage.removeItem(getCartKey(null))
            } else {
              setItems([])
            }
          } else {
            setItems([])
          }
        } else {
          setItems([])
        }
      } else {
        // No saved cart for this key — migrate guest cart if user just logged in
        if (user?.id) {
          const guestCart = localStorage.getItem(getCartKey(null))
          if (guestCart) {
            const guestItems: CartItem[] = JSON.parse(guestCart)
            const validItems = guestItems.filter((i) => i.product && i.product.id && typeof i.product.price_per_100 === "number" && (!isCalcutta(i.product) || i.unitsVersion === 2)).map(i => ({ ...i, quantity: normalizeQuantity(i.product, i.quantity) }))
            if (validItems.length > 0) {
              setItems(validItems)
              localStorage.removeItem(getCartKey(null))
            } else {
              setItems([])
            }
          } else {
            setItems([])
          }
        } else {
          setItems([])
        }
      }
    } catch { /* ignore */ }

    setCurrentCartKey(cartKey)
    setHydrated(true)
  }, [user, authLoading, currentCartKey])

  // Persist to localStorage on every change (only after initial load and auth resolved)
  useEffect(() => {
    if (hydrated && currentCartKey && !authLoading) {
      localStorage.setItem(currentCartKey, JSON.stringify(items))
    }
  }, [items, hydrated, currentCartKey, authLoading])

  const addItem = useCallback((product: Product, quantity: number, isBulk: boolean) => {
    quantity = normalizeQuantity(product, quantity)
    isBulk = bulkActive(product, quantity, isBulk)
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, product, quantity: i.quantity + quantity, isBulk: bulkActive(product, i.quantity + quantity, true), unitsVersion: 2 }
            : i
        )
      }
      return [...prev, { product, quantity, isBulk, unitsVersion: 2 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: normalizeQuantity(i.product, quantity), isBulk: bulkActive(i.product, quantity, true) }
          : i
      )
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const subtotal = items.reduce((sum, i) => sum + linePricing(i.product, i.quantity, i.isBulk).subtotal, 0)
  const discount = items.reduce((sum, i) => sum + linePricing(i.product, i.quantity, i.isBulk).discount, 0)

  const total = subtotal - discount

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        discount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

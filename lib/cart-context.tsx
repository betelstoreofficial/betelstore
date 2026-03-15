"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { Product } from "@/lib/db"

interface CartItem {
  product: Product
  quantity: number
  isBulk: boolean
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

const CART_STORAGE_KEY = "betel-cart"

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load cart from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // Persist to localStorage on every change (only after initial load)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

  const addItem = useCallback((product: Product, quantity: number, isBulk: boolean) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity, isBulk }
            : i
        )
      }
      return [...prev, { product, quantity, isBulk }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price_per_kg * i.quantity,
    0
  )

  const discount = items.reduce((sum, i) => {
    if (i.isBulk && i.quantity >= i.product.bulk_min_kg) {
      return sum + (i.product.price_per_kg - i.product.bulk_price_per_kg) * i.quantity
    }
    return sum
  }, 0)

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

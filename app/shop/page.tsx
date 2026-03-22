"use client"

import { useEffect, useState } from "react"
import { Zap, Truck, ShieldCheck } from "lucide-react"
import { DailyPriceTable } from "@/components/daily-price-table"
import { ProductCard } from "@/components/product-card"
import { getProducts, type Product } from "@/lib/db"

const features = [
  { icon: Zap, label: "Instant Quotes" },
  { icon: Truck, label: "Pan-India Delivery" },
  { icon: ShieldCheck, label: "Quality Assured" },
]

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      const data = await getProducts()
      setProducts(data)
      setLoading(false)
    }
    loadProducts()
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* Hero + Mandi Rates Side by Side */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:mb-12 lg:grid-cols-2 lg:items-start">
        {/* Hero Section */}
        <section className="flex flex-col justify-center gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl text-balance">
              Premium Betel Leaves,
              <br />
              <span className="text-primary">Wholesale Prices.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Source the finest betel leaves directly from growers. Real-time mandi
              rates, bulk discounts, and fast delivery across India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2"
              >
                <f.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-card-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Daily Price Table */}
        <DailyPriceTable />
      </div>

      {/* Products Grid */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-foreground md:text-2xl">
            Shop Betel Leaves
          </h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {loading ? "..." : `${products.length} varieties`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[420px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

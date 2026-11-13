"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Zap, Truck, ShieldCheck, ArrowRight } from "lucide-react"
import { DailyPriceTable } from "@/components/daily-price-table"
import { ProductCard } from "@/components/product-card"
import { getProducts, type Product } from "@/lib/db"
import { proxyImageUrl } from "@/lib/utils"

const features = [
  { icon: Zap, label: "Instant Quotes" },
  { icon: Truck, label: "Pan-India Delivery" },
  { icon: ShieldCheck, label: "Quality Assured" },
]

const HERO_IMAGE_URL =
  "https://ohlovnugqjktbayxgmku.supabase.co/storage/v1/object/public/product-images/1776274945903-1iayz.jpeg"

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
      <div className="mb-8 grid grid-cols-1 gap-6 md:mb-12 lg:grid-cols-2 lg:items-stretch">
        {/* Hero Section */}
        <section className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#082f1c] via-primary to-emerald-600 p-6 text-primary-foreground shadow-xl shadow-primary/25 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-balance md:text-4xl">
                Premium Betel Leaves,{" "}
                <span className="text-emerald-200">Wholesale Prices.</span>
              </h1>
              <Image
                src={proxyImageUrl(HERO_IMAGE_URL)!}
                alt="Banarasi betel leaves"
                width={96}
                height={96}
                className="h-20 w-20 shrink-0 rounded-full border-[3px] border-white/35 object-cover shadow-lg md:h-24 md:w-24"
              />
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Real-time mandi rates, bulk discounts, and fast delivery across
              India. Export enquiries welcome.
            </p>
            <a
              href="#products"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
            >
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative mt-5 flex items-stretch gap-2">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-2"
              >
                <f.icon className="h-3.5 w-3.5 shrink-0 text-emerald-200" />
                <span className="text-[11px] font-medium leading-tight text-white/95">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Daily Price Table */}
        <DailyPriceTable />
      </div>

      {/* Products Grid */}
      <section id="products" className="scroll-mt-20">
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
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-8 rounded bg-muted" />
                  <div className="h-10 rounded bg-muted" />
                </div>
              </div>
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

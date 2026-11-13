import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/db"
import { productSlug } from "@/lib/product-slug"
import {
  isCalcutta,
  quantityRules,
  packagingDescription,
  bulkMinimum,
} from "@/lib/product-units"
import { ProductCard } from "@/components/product-card"

export const dynamic = "force-dynamic"

async function findProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("products").select("*")
    if (error || !data) return null
    const products = data as Product[]
    return products.find((p) => productSlug(p.name) === slug) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) {
    return { title: "Betel Leaves | The Betel Store" }
  }
  return {
    title: `${product.name} Wholesale | The Betel Store`,
    description: `${product.name} from ${product.origin}, ${product.grade}. ${product.description} Daily mandi rates and bulk supply from The Betel Store, Ahmedabad.`,
    alternates: { canonical: `/shop/${slug}` },
  }
}

export default async function VarietyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()

  const rules = quantityRules(product)
  const calcutta = isCalcutta(product)
  const pageUrl = `https://thebetelstore.com/shop/${slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: `${product.description} ${packagingDescription(product)}`.trim(),
    url: pageUrl,
    category: "Betel leaves",
    brand: { "@type": "Brand", name: "The Betel Store" },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: product.price_per_100,
        priceCurrency: "INR",
        unitText: rules.rate,
      },
    },
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/shop"
        className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.origin} &middot; {product.grade}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            {product.description}
            <span className="mt-1 block">{packagingDescription(product)}</span>
          </p>
          <div className="mt-6 flex flex-wrap items-baseline gap-2">
            <span className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground">
              {"\u20B9"}
              {product.price_per_100.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-muted-foreground">{rules.rate}</span>
          </div>
          {product.bulk_price_per_1000 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Bulk price: {"\u20B9"}
              {product.bulk_price_per_1000.toLocaleString("en-IN")} per{" "}
              {calcutta ? "bharti" : "1000 leaves"}, minimum{" "}
              {bulkMinimum(product)} {rules.unit}.
            </p>
          ) : null}
        </div>
        <div className="max-w-md">
          <ProductCard product={product} index={0} />
        </div>
      </div>
    </main>
  )
}

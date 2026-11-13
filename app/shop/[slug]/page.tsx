import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/db"
import { productSlug } from "@/lib/product-slug"
import {
  quantityRules,
  packagingDescription,
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

      <h1 className="sr-only">{product.name}</h1>
      <div className="max-w-md">
        <ProductCard product={product} index={0} />
      </div>
    </main>
  )
}

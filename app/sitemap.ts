import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { productSlug } from "@/lib/product-slug"
import type { Product } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://thebetelstore.com"
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/export`, changeFrequency: "monthly", priority: 0.8 },
  ]
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("products").select("name")
    const products = (data || []) as Pick<Product, "name">[]
    const varietyRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/shop/${productSlug(p.name)}`,
      changeFrequency: "daily",
      priority: 0.7,
    }))
    return [...staticRoutes, ...varietyRoutes]
  } catch {
    return staticRoutes
  }
}

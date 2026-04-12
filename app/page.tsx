"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Leaf,
  TrendingUp,
  Truck,
  ShieldCheck,
  Star,
  Package,
  BadgePercent,
  HeadphonesIcon,
  Search,
  ClipboardList,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Building2,
  Users,
  Zap,
} from "lucide-react"
import { DailyPriceTable } from "@/components/daily-price-table"
import { ProductCard } from "@/components/product-card"
import { getProducts, type Product } from "@/lib/db"

const DEFAULT_SETTINGS = {
  phone: "+91 99999 99999",
  email: "hello@betelwholesale.com",
  whatsapp: "919999999999",
  address: "Mumbai, Maharashtra, India",
  business_hours_weekday: "Mon – Sat: 6 AM – 9 PM",
  business_hours_weekend: "Sunday: 8 AM – 2 PM",
}

function getWhatsAppLink(whatsapp: string) {
  return `https://wa.me/${whatsapp}?text=Hi%2C%20I%27d%20like%20a%20bulk%20quote%20for%20betel%20leaves`
}

const trustItems = [
  { icon: Users, label: "500+ Businesses" },
  { icon: Truck, label: "Same Day / Next Day Delivery" },
  { icon: Leaf, label: "Farm Fresh" },
  { icon: ShieldCheck, label: "Quality Assured" },
]

const stats = [
  { value: "6+", label: "Varieties", icon: Leaf },
  { value: "20+", label: "Cities Served", icon: MapPin },
  { value: "500+", label: "Orders Fulfilled", icon: Package },
  { value: "Same Day", label: "Dispatch", icon: Zap },
]

const usps = [
  {
    icon: Leaf,
    title: "Farm-Fresh Sourcing",
    desc: "Direct procurement from farms across India ensures freshness and traceability.",
  },
  {
    icon: BadgePercent,
    title: "Competitive Pricing",
    desc: "Real-time mandi rates and transparent pricing with no hidden middleman costs.",
  },
  {
    icon: ShieldCheck,
    title: "Graded Quality",
    desc: "Every batch is hand-sorted and graded so you get consistent, premium leaves.",
  },
  {
    icon: Truck,
    title: "Fast Logistics",
    desc: "Temperature-controlled packing and rapid dispatch across India within 24 hours.",
  },
  {
    icon: TrendingUp,
    title: "Bulk Discounts",
    desc: "Order more, save more. Automatic tiered discounts on large orders.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    desc: "A personal account manager to handle your orders and resolve queries.",
  },
]

const steps = [
  {
    num: "1",
    title: "Browse & Select",
    desc: "Explore our catalogue of premium betel leaf varieties with live pricing.",
    icon: Search,
  },
  {
    num: "2",
    title: "Place Your Order",
    desc: "Add to cart and checkout. We offer bulk discounts automatically.",
    icon: ClipboardList,
  },
  {
    num: "3",
    title: "Fast Delivery",
    desc: "Same day delivery on Mon/Wed/Fri. Next day delivery on other days. Delivery fee based on Porter/Rapido charges.",
    icon: Truck,
  },
]

const testimonials = [
  {
    name: "Rajesh Kumar",
    business: "Kumar Paan Bhandar, Delhi",
    quote:
      "Betel Wholesale transformed how we source paan leaves. Consistent quality and the prices are always fair.",
    stars: 5,
  },
  {
    name: "Suresh Patel",
    business: "Patel Trading Co., Mumbai",
    quote:
      "Same-day dispatch is a game changer. My customers notice the freshness difference. Highly recommended!",
    stars: 5,
  },
  {
    name: "Anita Sharma",
    business: "Sharma Caterers, Lucknow",
    quote:
      "We switched from our local mandi to Betel Wholesale and haven't looked back. The bulk discounts are great.",
    stars: 4,
  },
]

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    async function load() {
      const data = await getProducts()
      setProducts(data.slice(0, 3))
    }
    load()

    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col">
      {/* ─── SECTION 1: HERO ─── */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/25 via-emerald-100/40 to-background dark:from-primary/15 dark:via-emerald-950/30 dark:to-background">
        {/* Decorative blob */}
        <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] opacity-30" viewBox="0 0 600 600" aria-hidden="true">
          <path d="M300 50C420 50 550 150 550 300C550 450 420 550 300 550C180 550 50 450 50 300C50 150 180 50 300 50Z" fill="var(--primary)" fillOpacity="0.1" />
        </svg>
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-32">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <span className="mb-6 inline-flex animate-in fade-in slide-in-from-top-4 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary duration-500">
              <Leaf className="h-3.5 w-3.5" />
              India&apos;s Trusted B2B Betel Leaf Marketplace
            </span>

            {/* Heading */}
            <h1 className="mb-6 max-w-3xl animate-in fade-in slide-in-from-top-4 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-foreground duration-500 delay-100 md:text-5xl lg:text-6xl text-balance">
              Source Premium Betel Leaves{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                at Wholesale Prices
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-8 max-w-xl animate-in fade-in slide-in-from-top-4 text-base leading-relaxed text-muted-foreground duration-500 delay-200 md:text-lg">
              Real-time mandi rates, farm-fresh sourcing, bulk discounts, and
              same-day dispatch — everything your business needs in one platform.
            </p>

            {/* CTAs */}
            <div className="mb-12 flex animate-in fade-in slide-in-from-top-4 flex-wrap items-center justify-center gap-4 duration-500 delay-300">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:brightness-110"
              >
                Browse Products
                <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href={getWhatsAppLink(settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get bulk quote on WhatsApp (opens in new tab)"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
              >
                Get Bulk Quote
              </a>
            </div>

            {/* Trust Row */}
            <div className="flex animate-in fade-in slide-in-from-bottom-4 flex-wrap items-center justify-center gap-6 duration-500 delay-500 md:gap-8">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium md:text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: LIVE MANDI RATES + STATS ─── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            {/* Left: Mandi Rates */}
            <DailyPriceTable />

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center transition-all hover:shadow-md hover:border-primary/30 hover:scale-[1.02]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground">
                    {stat.value}
                  </span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: FEATURED PRODUCTS ─── */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
            Our Premium Betel Leaf Varieties
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
            Hand-picked, graded, and packed for freshness. Sourced from the best
            farms across India.
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
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
        )}

        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            View All Products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── SECTION 4: WHY CHOOSE US ─── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-10 text-center">
            <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
              Why Choose Betel Wholesale
            </h2>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
              We simplify betel leaf procurement so you can focus on growing your
              business.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usps.map((usp, i) => (
              <div
                key={usp.title}
                className="group animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30 duration-500"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-emerald-400/15 transition-transform group-hover:scale-110">
                  <usp.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-base font-semibold text-card-foreground">
                  {usp.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{usp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: HOW IT WORKS ─── */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
            Three simple steps to fresh betel leaves at your doorstep.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-4">
          {/* Connecting line (desktop) */}
          <div className="absolute left-[16.67%] right-[16.67%] top-8 hidden h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 md:block" />

          {steps.map((step) => (
            <div key={step.num} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background shadow-md shadow-primary/20">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                Step {step.num}
              </span>
              <h3 className="mb-1 font-[family-name:var(--font-heading)] text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 6: TESTIMONIALS ─── */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-10 text-center">
            <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
              Trusted by Businesses Across India
            </h2>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
              Hear what our partners have to say about working with us.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative overflow-hidden rounded-xl border border-border bg-card p-6"
              >
                <span className="pointer-events-none absolute -top-4 -left-2 font-[family-name:var(--font-heading)] text-8xl font-bold text-primary/5 select-none" aria-hidden="true">&ldquo;</span>
                <div className="mb-3 flex gap-0.5" role="img" aria-label={`${t.stars} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      className={`h-4 w-4 ${
                        i < t.stars
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: CTA BANNER ─── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-emerald-600 to-teal-600">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center md:py-16">
          <h2 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold text-primary-foreground md:text-3xl">
            Start Sourcing Premium Betel Leaves Today
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-sm text-primary-foreground/80 md:text-base">
            Join 500+ businesses across India who trust Betel Wholesale for
            consistent quality and competitive pricing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Browse Products
              <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href={getWhatsAppLink(settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact us on WhatsApp (opens in new tab)"
              className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: FOOTER ─── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Image src="/tbs-leaf.png" alt="The Betel Store" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
                <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-foreground">
                  Betel Wholesale
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                India&apos;s trusted B2B marketplace for premium betel leaves.
                Farm-fresh sourcing, transparent pricing, same day &amp; next day delivery.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { href: "/", label: "Home" },
                  { href: "/shop", label: "Shop All" },
                  { href: "/cart", label: "Cart" },
                  { href: "/orders", label: "My Orders" },
                  { href: "/account", label: "Account" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Contact</h3>
              <ul className="space-y-3">
                <li>
                  <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {settings.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {settings.email}
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {settings.address}
                </li>
              </ul>
            </div>

            {/* Business Hours */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Business Hours</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {settings.business_hours_weekday}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {settings.business_hours_weekend}
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Betel Wholesale. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

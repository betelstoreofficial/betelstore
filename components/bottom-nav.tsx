"use client"

import { useState, type MouseEvent } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, ShoppingCart, ClipboardList, User, Shield, Phone, MessageCircle, HeadphonesIcon } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { isAdminClient } from "@/lib/admin"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { getTelLink, getWhatsAppLink } from "@/lib/site-settings"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"

function tabClass(active: boolean) {
  return `relative flex min-w-[44px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
    active ? "text-primary" : "text-muted-foreground"
  }`
}

function sheetRowClass() {
  return "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
}

// Tapping the tab for the page you are already on scrolls back to the top.
function scrollTopIfActive(active: boolean) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (!active) return
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}

export function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()
  const { user } = useAuth()
  const settings = useSiteSettings()
  const [sheet, setSheet] = useState<"cart" | "contact" | null>(null)

  const showAdmin = user && isAdminClient(user.email)
  const cartActive = pathname.startsWith("/cart") || pathname.startsWith("/orders")

  const links = [
    { href: "/shop", label: "Shop", icon: Store },
  ]

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-around">
          {links.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href} onClick={scrollTopIfActive(isActive)} className={tabClass(isActive)}>
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setSheet("cart")}
            aria-label="Open cart and orders"
            className={tabClass(cartActive)}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                  {totalItems}
                </span>
              )}
            </div>
            <span>Cart</span>
            {cartActive && (
              <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
            )}
          </button>
          <Link href="/account" onClick={scrollTopIfActive(pathname.startsWith("/account"))} className={tabClass(pathname.startsWith("/account"))}>
            <User className="h-5 w-5" />
            <span>Account</span>
            {pathname.startsWith("/account") && (
              <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
            )}
          </Link>
          {showAdmin && (
            <Link href="/admin" onClick={scrollTopIfActive(pathname.startsWith("/admin"))} className={tabClass(pathname.startsWith("/admin"))}>
              <Shield className="h-5 w-5" />
              <span>Admin</span>
              {pathname.startsWith("/admin") && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSheet("contact")}
            aria-label="Open contact options"
            className={tabClass(false)}
          >
            <HeadphonesIcon className="h-5 w-5" />
            <span>Contact</span>
          </button>
        </div>
      </nav>

      <Drawer open={sheet === "cart"} onOpenChange={(open) => { if (!open) setSheet(null) }}>
        <DrawerContent aria-describedby={undefined}>
          <DrawerTitle className="sr-only">Cart and orders</DrawerTitle>
          <div className="mx-auto w-full max-w-md px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">
            <Link href="/cart" onClick={() => setSheet(null)} className={sheetRowClass()}>
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground tabular-nums">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link href="/orders" onClick={() => setSheet(null)} className={sheetRowClass()}>
              <ClipboardList className="h-5 w-5 text-primary" />
              <span>My Orders</span>
            </Link>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={sheet === "contact"} onOpenChange={(open) => { if (!open) setSheet(null) }}>
        <DrawerContent aria-describedby={undefined}>
          <DrawerTitle className="sr-only">Contact us</DrawerTitle>
          <div className="mx-auto w-full max-w-md px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2">
            <a
              href={getTelLink(settings.phone)}
              aria-label={`Call us at ${settings.phone}`}
              onClick={() => setSheet(null)}
              className={sheetRowClass()}
            >
              <Phone className="h-5 w-5 text-primary" />
              <span>Call {settings.phone}</span>
            </a>
            <a
              href={getWhatsAppLink(settings.whatsapp, "Hi, I'd like a bulk quote for betel leaves")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp (opens in new tab)"
              onClick={() => setSheet(null)}
              className={sheetRowClass()}
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              <span>WhatsApp</span>
            </a>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

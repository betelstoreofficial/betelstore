"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, ShoppingCart, ClipboardList, User, Shield, Phone, MessageCircle } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { isAdminClient } from "@/lib/admin"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { getTelLink, getWhatsAppLink } from "@/lib/site-settings"

const tabs = [
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/account", label: "Account", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()
  const { user } = useAuth()
  const settings = useSiteSettings()

  const showAdmin = user && isAdminClient(user.email)

  const allTabs = showAdmin
    ? [...tabs, { href: "/admin", label: "Admin", icon: Shield }]
    : tabs

  const contactActions = [
    {
      href: getTelLink(settings.phone),
      label: "Call",
      icon: Phone,
      external: false,
      ariaLabel: `Call us at ${settings.phone}`,
    },
    {
      href: getWhatsAppLink(settings.whatsapp, "Hi, I'd like a bulk quote for betel leaves"),
      label: "WhatsApp",
      icon: MessageCircle,
      external: true,
      ariaLabel: "Chat with us on WhatsApp (opens in new tab)",
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {allTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-w-[48px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.href === "/cart" && totalItems > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
                    {totalItems}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
        {contactActions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            aria-label={action.ariaLabel}
            {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="relative flex min-w-[48px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
          >
            <action.icon className="h-5 w-5" />
            <span>{action.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}

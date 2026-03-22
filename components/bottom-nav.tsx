"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, ShoppingCart, ClipboardList, User, Shield } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { isAdminClient } from "@/lib/admin"

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

  const showAdmin = user && isAdminClient(user.email)

  const allTabs = showAdmin
    ? [...tabs, { href: "/admin", label: "Admin", icon: Shield }]
    : tabs

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {allTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex min-w-[64px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
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
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

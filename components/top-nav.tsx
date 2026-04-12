"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Leaf, ShoppingCart, Package, User, LogIn, Shield } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { isAdminClient } from "@/lib/admin"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navLinks = [
  { href: "/shop", label: "Shop", icon: Leaf },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/account", label: "Account", icon: User },
]

export function TopNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()
  const { user, loading } = useAuth()

  return (
    <>
    {/* Mobile Header */}
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-4 md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/tbs-leaf.png" alt="The Betel Store" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
        <span className="font-[family-name:var(--font-heading)] text-base font-bold text-foreground">
          The Betel Store
        </span>
      </Link>
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        ) : user ? (
          <Link href="/account" className="block">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || "User"} />
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>

    {/* Desktop Header */}
    <header className="fixed inset-x-0 top-0 z-50 hidden h-16 border-b border-border bg-background/80 backdrop-blur-lg md:block">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/0 to-emerald-600/15 ">
            <Image src="/tbs-leaf.png" alt="The Betel Store" width={24} height={24} className="h-10 w-10 rounded-lg object-contain" />
          </div>
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-foreground">
            The Betel Store
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
                {link.href === "/cart" && totalItems > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums">
                    {totalItems}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}

          {user && isAdminClient(user.email) && (
            <Link
              href="/admin"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}

          <div className="ml-3 border-l border-border pl-3">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <Link href="/account" className="block">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
    </>
  )
}

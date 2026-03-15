"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  MapPin,
  Calendar,
  Package,
  IndianRupee,
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { getOrders, type Order } from "@/lib/db"

const quickLinks = [
  { href: "/orders", label: "Order History", icon: Package },
  { href: "#", label: "Settings", icon: Settings },
  { href: "#", label: "Help & Support", icon: HelpCircle },
]

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    async function loadOrders() {
      if (user?.id) {
        const data = await getOrders(user.id)
        setOrders(data)
      }
    }
    loadOrders()
  }, [user])

  // Show loading while auth checks (middleware handles redirect)
  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  const profileFields = [
    { icon: Building2, label: "Business", value: user.user_metadata?.business_name || "Not set" },
    { icon: Phone, label: "Phone", value: user.user_metadata?.phone || "Not set" },
    { icon: Mail, label: "Email", value: user.email || "Not set" },
    { icon: FileText, label: "GST", value: user.user_metadata?.gst || "Not set" },
    { icon: MapPin, label: "Address", value: user.user_metadata?.address || "Not set" },
    { icon: Calendar, label: "Member Since", value: new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your buyer profile and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Profile Card */}
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-border bg-card duration-400">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <User className="h-7 w-7" />
              )}
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-card-foreground">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="flex">
            <div className="flex flex-1 flex-col items-center gap-1 py-5">
              <div className="flex items-center gap-1 text-xl font-bold text-card-foreground">
                <Package className="h-5 w-5 text-primary" />
                {totalOrders}
              </div>
              <span className="text-xs text-muted-foreground">Total Orders</span>
            </div>
            <Separator orientation="vertical" className="h-auto" />
            <div className="flex flex-1 flex-col items-center gap-1 py-5">
              <div className="flex items-center gap-1 text-xl font-bold text-card-foreground">
                <IndianRupee className="h-5 w-5 text-primary" />
                {(totalSpent / 1000).toFixed(0)}K
              </div>
              <span className="text-xs text-muted-foreground">Total Spent</span>
            </div>
          </div>

          <Separator />

          <div className="p-5">
            <div className="flex flex-col gap-4">
              {profileFields.map((field, i) => (
                <div
                  key={field.label}
                  style={{ animationDelay: `${100 + i * 50}ms` }}
                  className="flex animate-in fade-in slide-in-from-left-4 items-start gap-3 fill-mode-both duration-300"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <field.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-medium text-card-foreground">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="flex animate-in fade-in slide-in-from-bottom-4 flex-col gap-4 duration-500 lg:w-72">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Quick Links</h3>
            <div className="flex flex-col gap-1">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-card-foreground transition-colors hover:bg-secondary"
                >
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full gap-2 text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}

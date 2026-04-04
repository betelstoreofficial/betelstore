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
  Clock,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { getOrders, type Order } from "@/lib/db"

const DEFAULT_SETTINGS = {
  phone: "+91 99999 99999",
  email: "hello@betelwholesale.com",
  whatsapp: "919999999999",
  address: "Mumbai, Maharashtra, India",
  business_hours_weekday: "Mon – Sat: 6 AM – 9 PM",
  business_hours_weekend: "Sunday: 8 AM – 2 PM",
}

const faqs = [
  {
    question: "How do I place a bulk order?",
    answer:
      "Browse our shop, select your preferred betel leaf variety, choose the quantity, and switch to 'Bulk' pricing for orders above the minimum threshold. Add to cart and proceed to checkout. Bulk discounts are applied automatically.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major payment methods through Razorpay — UPI, credit/debit cards, net banking, and popular wallets. All transactions are secured with industry-standard encryption.",
  },
  {
    question: "How is pricing determined?",
    answer:
      "Our prices are based on real-time mandi (wholesale market) rates updated daily. You can view the current rates on our homepage and shop page. Bulk orders receive automatic tiered discounts.",
  },
  {
    question: "What is the delivery timeline?",
    answer:
      "We dispatch orders same-day for orders placed before 2 PM. Delivery typically takes 1–3 days depending on your location. We deliver across 20+ cities in India with temperature-controlled packing.",
  },
  {
    question: "Can I cancel or modify an order?",
    answer:
      "You can request cancellation while your order is in 'Processing' status by contacting our support team. Once an order is shipped, it cannot be cancelled. Modifications to quantity are not supported after order placement.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach us via phone, email, or WhatsApp — all contact details are listed below. Our team is available during business hours and typically responds within 1 hour.",
  },
]

export default function AccountPage() {
  const { user, loading: authLoading, signOut, refreshUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    business_name: "",
    phone: "",
    gst: "",
    address: "",
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Help dialog state
  const [helpOpen, setHelpOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS)

  useEffect(() => {
    async function loadOrders() {
      if (user?.id) {
        const data = await getOrders(user.id)
        setOrders(data)
      }
    }
    loadOrders()
  }, [user])

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSiteSettings(data)
      })
      .catch(() => {})
  }, [])

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

  function openSettings() {
    if (!user) return
    setProfileForm({
      full_name: user.user_metadata?.full_name || "",
      business_name: user.user_metadata?.business_name || "",
      phone: user.user_metadata?.phone || "",
      gst: user.user_metadata?.gst || "",
      address: user.user_metadata?.address || "",
    })
    setSettingsOpen(true)
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name,
          business_name: profileForm.business_name,
          phone: profileForm.phone,
          gst: profileForm.gst,
          address: profileForm.address,
        },
      })

      if (error) throw error

      await refreshUser()
      toast.success("Profile updated")
      setSettingsOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
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

  const whatsappLink = `https://wa.me/${siteSettings.whatsapp}?text=Hi%2C%20I%20need%20help%20with%20my%20order`

  const incompleteFields = profileFields.filter(
    (f) => f.value === "Not set" && f.label !== "Member Since"
  ).length

  const formatSpent = (amount: number) => {
    if (amount === 0) return "0"
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
    return amount.toLocaleString("en-IN")
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your buyer profile and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Profile Card */}
        <div className="flex-1 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || "Profile photo"} width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <User className="h-7 w-7" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-card-foreground">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={openSettings}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary active:bg-accent/50"
              aria-label="Edit profile"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {incompleteFields > 0 && (
            <button
              type="button"
              onClick={openSettings}
              className="mx-5 mb-4 flex w-[calc(100%-2.5rem)] items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-left text-xs font-medium text-warning-foreground transition-colors hover:bg-warning/15"
            >
              <Settings className="h-3.5 w-3.5 flex-shrink-0" />
              Complete your profile — {incompleteFields} {incompleteFields === 1 ? "field" : "fields"} remaining
              <ChevronRight className="ml-auto h-3.5 w-3.5" />
            </button>
          )}

          <Separator />

          <div className="flex">
            <div className="flex flex-1 flex-col items-center gap-1 py-5">
              <div className="flex items-center gap-1 text-xl font-bold text-card-foreground tabular-nums">
                <Package className="h-5 w-5 text-primary" />
                {totalOrders}
              </div>
              <span className="text-xs text-muted-foreground">Total Orders</span>
            </div>
            <Separator orientation="vertical" className="h-auto" />
            <div className="flex flex-1 flex-col items-center gap-1 py-5">
              <div className="flex items-center gap-1 text-xl font-bold text-card-foreground tabular-nums">
                <IndianRupee className="h-5 w-5 text-primary" />
                {formatSpent(totalSpent)}
              </div>
              <span className="text-xs text-muted-foreground">Total Spent</span>
            </div>
          </div>

          <Separator />

          <div className="p-5">
            <div className="flex flex-col gap-4">
              {profileFields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-start gap-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <field.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <p className={`text-sm font-medium ${field.value === "Not set" ? "text-muted-foreground/60 italic" : "text-card-foreground"}`}>
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="flex flex-col gap-4 lg:w-72">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Quick Links</h3>
            <div className="flex flex-col gap-1">
              <Link
                href="/orders"
                className="group/link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-card-foreground transition-colors hover:bg-secondary active:bg-accent/50"
              >
                <Package className="h-4 w-4 text-muted-foreground transition-colors group-hover/link:text-primary" />
                <span className="flex-1">Order History</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <button
                type="button"
                onClick={openSettings}
                className="group/link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-card-foreground transition-colors hover:bg-secondary active:bg-accent/50 text-left"
              >
                <Settings className="h-4 w-4 text-muted-foreground transition-colors group-hover/link:text-primary" />
                <span className="flex-1">Edit Profile</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="group/link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-card-foreground transition-colors hover:bg-secondary active:bg-accent/50 text-left"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground transition-colors group-hover/link:text-primary" />
                <span className="flex-1">Help & Support</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                autoComplete="name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  autoComplete="organization"
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile_phone">Phone</Label>
                <Input
                  id="profile_phone"
                  type="tel"
                  autoComplete="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  autoComplete="off"
                  value={profileForm.gst}
                  onChange={(e) => setProfileForm({ ...profileForm, gst: e.target.value })}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile_address">Address</Label>
                <Input
                  id="profile_address"
                  autoComplete="street-address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed as it is linked to your Google account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Support Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* FAQs */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <Separator />

            {/* Contact Info */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Contact Us</h3>
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${siteSettings.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm text-card-foreground transition-colors hover:bg-secondary"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{siteSettings.phone}</p>
                    <p className="text-xs text-muted-foreground">Call us</p>
                  </div>
                </a>
                <a
                  href={`mailto:${siteSettings.email}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm text-card-foreground transition-colors hover:bg-secondary"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{siteSettings.email}</p>
                    <p className="text-xs text-muted-foreground">Email us</p>
                  </div>
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm text-card-foreground transition-colors hover:bg-secondary"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Chat with us</p>
                  </div>
                </a>
                <div className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">{siteSettings.address}</p>
                    <p className="text-xs text-muted-foreground">Our office</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">{siteSettings.business_hours_weekday}</p>
                    <p className="font-medium text-card-foreground">{siteSettings.business_hours_weekend}</p>
                    <p className="text-xs text-muted-foreground">Business hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

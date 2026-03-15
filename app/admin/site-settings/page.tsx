"use client"

import { useEffect, useState, useCallback } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface SiteSettings {
  id: string
  phone: string
  email: string
  whatsapp: string
  address: string
  business_hours_weekday: string
  business_hours_weekend: string
  updated_at: string
}

export default function AdminSiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/site-settings")
      .then((res) => res.json())
      .then((data: SiteSettings) => setSettings(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  function update(field: keyof SiteSettings, value: string) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: settings.phone,
          email: settings.email,
          whatsapp: settings.whatsapp,
          address: settings.address,
          business_hours_weekday: settings.business_hours_weekday,
          business_hours_weekend: settings.business_hours_weekend,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save settings")
      }
      toast.success("Settings saved successfully")
      fetchSettings()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No settings found. Run the migration script first.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage contact details displayed on the landing page.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="mr-1 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              value={settings.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="919999999999"
            />
            <p className="text-xs text-muted-foreground">
              Country code + number, no spaces or symbols (e.g. 919999999999)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_hours_weekday">Weekday Hours</Label>
            <Input
              id="business_hours_weekday"
              value={settings.business_hours_weekday}
              onChange={(e) => update("business_hours_weekday", e.target.value)}
              placeholder="Mon – Sat: 6 AM – 9 PM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_hours_weekend">Weekend Hours</Label>
            <Input
              id="business_hours_weekend"
              value={settings.business_hours_weekend}
              onChange={(e) => update("business_hours_weekend", e.target.value)}
              placeholder="Sunday: 8 AM – 2 PM"
            />
          </div>
        </div>
      </div>

      {settings.updated_at && (
        <p className="text-xs text-muted-foreground">
          Last updated:{" "}
          {new Date(settings.updated_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  )
}

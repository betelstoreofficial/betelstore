"use client"

import { useEffect, useState } from "react"
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/site-settings"

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setSettings(data)
      })
      .catch(() => {})
  }, [])

  return settings
}

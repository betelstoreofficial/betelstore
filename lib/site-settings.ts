export interface SiteSettings {
  phone: string
  email: string
  whatsapp: string
  address: string
  business_hours_weekday: string
  business_hours_weekend: string
}

// Built-in defaults mirror the live site_settings row, so the first render
// never flashes placeholder contact details while /api/site-settings loads.
export const DEFAULT_SETTINGS: SiteSettings = {
  phone: "+91 8401603903",
  email: "info@thebetelstore.com",
  whatsapp: "918401603903",
  address: "Kalupur, Ahmedabad, GJ, India",
  business_hours_weekday: "Mon - Sat: 10 AM - 8 PM",
  business_hours_weekend: "Sunday: 5 PM - 8 PM",
}

export function getTelLink(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`
}

export function getWhatsAppLink(whatsapp: string, message?: string) {
  const base = `https://wa.me/${whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

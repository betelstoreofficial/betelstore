"use client"

import { useState } from "react"
import { track } from "@vercel/analytics"
import { DEFAULT_SETTINGS, getWhatsAppLink, getTelLink } from "@/lib/site-settings"

const VARIETIES = [
  "Banarasi Paan",
  "Bangla Paan",
  "Calcutta Paan (Full Size)",
  "Calcutta Paan (Medium Size)",
  "Kapuri Paan",
  "Maghai Paan",
  "Pali Paan",
  "Not sure yet, suggest for me",
]

const UNITS = ["leaves", "bundles (50 leaves)", "bharti (350-400 leaves)", "kg"]
const FREQUENCIES = ["One time", "Every week", "Every month"]

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"

const labelClass = "mb-1 block text-xs font-medium text-foreground"

export function ExportEnquiryForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [form, setForm] = useState({
    name: "",
    business: "",
    destination: "",
    contact: "",
    email: "",
    variety: "",
    quantity: "",
    unit: UNITS[0],
    frequency: FREQUENCIES[0],
    neededBy: "",
    airport: "",
    notes: "",
  })

  function update(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/export-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        throw new Error("send failed")
      }
      setStatus("sent")
      try {
        track("export_enquiry_submitted")
      } catch {
        // analytics unavailable
      }
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="font-[family-name:var(--font-heading)] text-lg font-semibold text-card-foreground">
          Thank you. We have your enquiry.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We will reply on WhatsApp or by phone.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="ee-name" className={labelClass}>
            Your name *
          </label>
          <input
            id="ee-name"
            required
            minLength={2}
            value={form.name}
            onChange={update("name")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ee-business" className={labelClass}>
            Business name
          </label>
          <input
            id="ee-business"
            value={form.business}
            onChange={update("business")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ee-destination" className={labelClass}>
            Destination country and city *
          </label>
          <input
            id="ee-destination"
            required
            placeholder="e.g. Toronto, Canada"
            value={form.destination}
            onChange={update("destination")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ee-contact" className={labelClass}>
            WhatsApp or phone *
          </label>
          <input
            id="ee-contact"
            required
            placeholder="With country code"
            value={form.contact}
            onChange={update("contact")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ee-email" className={labelClass}>
            Email
          </label>
          <input
            id="ee-email"
            type="email"
            value={form.email}
            onChange={update("email")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ee-variety" className={labelClass}>
            Variety
          </label>
          <select
            id="ee-variety"
            value={form.variety}
            onChange={update("variety")}
            className={inputClass}
          >
            <option value="">Choose a variety</option>
            {VARIETIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ee-quantity" className={labelClass}>
              Quantity *
            </label>
            <input
              id="ee-quantity"
              required
              inputMode="numeric"
              placeholder="e.g. 20"
              value={form.quantity}
              onChange={update("quantity")}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ee-unit" className={labelClass}>
              Unit
            </label>
            <select
              id="ee-unit"
              value={form.unit}
              onChange={update("unit")}
              className={inputClass}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="ee-frequency" className={labelClass}>
            How often
          </label>
          <select
            id="ee-frequency"
            value={form.frequency}
            onChange={update("frequency")}
            className={inputClass}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ee-neededby" className={labelClass}>
            Needed by (optional)
          </label>
          <input
            id="ee-neededby"
            placeholder="e.g. mid December"
            value={form.neededBy}
            onChange={update("neededBy")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ee-airport" className={labelClass}>
            Nearest airport (optional, for the freight quote)
          </label>
          <input
            id="ee-airport"
            value={form.airport}
            onChange={update("airport")}
            className={inputClass}
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="ee-notes" className={labelClass}>
          Anything else
        </label>
        <textarea
          id="ee-notes"
          rows={3}
          placeholder="Grade, leaf size, packing preference, or questions"
          value={form.notes}
          onChange={update("notes")}
          className={inputClass}
        />
      </div>

      {status === "error" && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          Your enquiry could not be sent. Please{" "}
          <a
            href={getWhatsAppLink(
              DEFAULT_SETTINGS.whatsapp,
              "Hi, I want to enquire about exporting betel leaves from India"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            WhatsApp us
          </a>{" "}
          or{" "}
          <a
            href={getTelLink(DEFAULT_SETTINGS.phone)}
            className="font-semibold text-primary hover:underline"
          >
            call us
          </a>{" "}
          instead.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send Enquiry"}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        No sign in needed. We reply on WhatsApp or by phone.
      </p>
    </form>
  )
}

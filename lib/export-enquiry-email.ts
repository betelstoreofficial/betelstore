import nodemailer from "nodemailer"

const EXPORT_TO = "info@thebetelstore.com"

export interface ExportEnquiryData {
  name: string
  business?: string
  destination: string
  contact: string
  email?: string
  variety?: string
  quantity?: string
  unit?: string
  frequency?: string
  neededBy?: string
  airport?: string
  notes?: string
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendExportEnquiry(enquiry: ExportEnquiryData): Promise<void> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    throw new Error("Email service is not configured")
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })

  const quantityLine = enquiry.quantity
    ? `${enquiry.quantity}${enquiry.unit ? ` ${enquiry.unit}` : ""}`
    : enquiry.unit || ""

  const allRows: Array<[string, string]> = [
    ["Name", enquiry.name],
    ["Business", enquiry.business || ""],
    ["Destination", enquiry.destination],
    ["WhatsApp or phone", enquiry.contact],
    ["Email", enquiry.email || ""],
    ["Variety", enquiry.variety || ""],
    ["Quantity", quantityLine],
    ["How often", enquiry.frequency || ""],
    ["Needed by", enquiry.neededBy || ""],
    ["Nearest airport", enquiry.airport || ""],
    ["Notes", enquiry.notes || ""],
  ]
  const rows = allRows.filter(([, v]) => v.trim().length > 0)

  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:6px 0;">${esc(v).replace(/\n/g, "<br>")}</td></tr>`
    )
    .join("")

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;"><h2 style="margin:0 0 14px;font-size:18px;">New export enquiry</h2><table style="border-collapse:collapse;">${tableRows}</table><p style="margin-top:18px;color:#777;font-size:12px;">Sent from thebetelstore.com/export</p></div>`

  const text =
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    "\n\nSent from thebetelstore.com/export"

  await transporter.sendMail({
    from: `The Betel Store <${user}>`,
    to: EXPORT_TO,
    replyTo: enquiry.email || undefined,
    subject: `Export enquiry - ${enquiry.destination} - ${enquiry.name}`,
    text,
    html,
  })
}

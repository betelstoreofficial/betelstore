import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { sendExportEnquiry } from "@/lib/export-enquiry-email"

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  business: z.string().trim().max(120).optional().or(z.literal("")),
  destination: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  variety: z.string().trim().max(80).optional().or(z.literal("")),
  quantity: z.string().trim().max(40).optional().or(z.literal("")),
  unit: z.string().trim().max(60).optional().or(z.literal("")),
  frequency: z.string().trim().max(40).optional().or(z.literal("")),
  neededBy: z.string().trim().max(40).optional().or(z.literal("")),
  airport: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = rateLimit(`export-enquiry:${ip}`, {
    maxRequests: 5,
    windowSeconds: 600,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many enquiries. Please try again later or use WhatsApp." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const parsed = enquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form fields and try again." },
      { status: 400 }
    )
  }

  try {
    await sendExportEnquiry(parsed.data)
  } catch (err) {
    console.error("Export enquiry email failed:", err)
    return NextResponse.json(
      { error: "Could not send your enquiry. Please WhatsApp or call us instead." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

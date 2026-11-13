import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, ClipboardList, Package, Plane } from "lucide-react"
import { DEFAULT_SETTINGS, getTelLink, getWhatsAppLink } from "@/lib/site-settings"
import { ExportEnquiryForm } from "@/components/export-enquiry-form"
import { TrackedLink } from "@/components/tracked-link"

export const metadata: Metadata = {
  title: "Betel Leaf Export Enquiry | The Betel Store",
  description:
    "Send a bulk betel leaf export enquiry. Share your destination, variety and quantity, and we reply with availability, packing and a quote.",
  alternates: { canonical: "/export" },
}

const steps = [
  {
    icon: ClipboardList,
    num: 1,
    title: "Send your requirement",
    desc: "Fill the form below. No account or sign in needed.",
  },
  {
    icon: Package,
    num: 2,
    title: "Get your quote",
    desc: "We confirm availability, packing and freight for your destination.",
  },
  {
    icon: Plane,
    num: 3,
    title: "Confirm and we prepare",
    desc: "Packing, freight and documents are agreed with you before anything is dispatched.",
  },
]

export default function ExportPage() {
  const whatsappHref = getWhatsAppLink(
    DEFAULT_SETTINGS.whatsapp,
    "Hi, I want to enquire about exporting betel leaves from India"
  )
  const telHref = getTelLink(DEFAULT_SETTINGS.phone)

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-20">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            Export enquiries
          </span>
          <h1 className="mx-auto mb-4 max-w-2xl font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground md:text-5xl">
            Bulk Betel Leaves,{" "}
            <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
              for Export from India.
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-sm text-muted-foreground md:text-base">
            Tell us your destination, variety and quantity. We reply with
            availability, packing and a full quote for your country.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#enquiry-form"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl"
            >
              Send an Enquiry
              <ChevronRight className="h-4 w-4" />
            </Link>
            <TrackedLink
              event="whatsapp_click"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact us on WhatsApp (opens in new tab)"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              WhatsApp Us
            </TrackedLink>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Reply on WhatsApp or call &middot; Packing and air freight quoted
            &middot; No sign in needed
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
            Three simple steps to fresh betel leaves at your airport.
          </p>
        </div>
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-4">
          <div className="absolute left-[16.67%] right-[16.67%] top-8 hidden h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 md:block" />
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background shadow-md shadow-primary/20">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">
                Step {step.num}
              </span>
              <h3 className="mb-1 font-[family-name:var(--font-heading)] text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Enquiry form */}
      <section id="enquiry-form" className="bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <div className="mb-8 text-center">
            <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground md:text-3xl">
              Send Your Export Enquiry
            </h2>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
              Share a few details and we will reply with availability and a
              quote.
            </p>
          </div>
          <ExportEnquiryForm />
        </div>
      </section>

      {/* Contact line */}
      <section className="mx-auto max-w-6xl px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Prefer to talk?{" "}
          <TrackedLink
            event="call_click"
            href={telHref}
            className="font-semibold text-primary hover:underline"
          >
            Call +91 8401603903
          </TrackedLink>
          {" · "}
          <a
            href="mailto:info@thebetelstore.com"
            className="font-semibold text-primary hover:underline"
          >
            info@thebetelstore.com
          </a>
          {" · "}
          Kalupur, Ahmedabad, GJ, India
        </p>
      </section>
    </main>
  )
}

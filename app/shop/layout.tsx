import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop Betel Leaves at Daily Mandi Rates | The Betel Store",
  description:
    "Wholesale betel leaves: Banarasi, Bangla, Calcutta, Kapuri, Maghai and Pali paan at daily mandi rates. Bulk discounts and fast dispatch from Ahmedabad.",
  alternates: { canonical: "/shop" },
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

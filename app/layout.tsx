import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/auth-context"
import { NavWrapper } from "@/components/nav-wrapper"
import { MainWrapper } from "@/components/main-wrapper"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "Betel Wholesale - Premium Betel Leaf B2B Marketplace | Paan Leaves Wholesale India",
  description:
    "India's trusted B2B wholesale marketplace for premium betel leaves (paan patta). Daily mandi rates, farm-fresh sourcing, bulk discounts, graded quality, and same-day dispatch across 20+ cities.",
  keywords: [
    "betel leaves wholesale",
    "paan patta wholesale",
    "betel leaf supplier India",
    "bulk betel leaves",
    "B2B paan marketplace",
    "mandi rates betel",
    "wholesale paan leaves online",
    "fresh betel leaves delivery",
  ],
  openGraph: {
    title: "Betel Wholesale - Premium Betel Leaf B2B Marketplace",
    description:
      "Source premium betel leaves at wholesale prices. Real-time mandi rates, bulk discounts, and same-day dispatch across India.",
    type: "website",
    locale: "en_IN",
    siteName: "Betel Wholesale",
  },
  twitter: {
    card: "summary_large_image",
    title: "Betel Wholesale - Premium Betel Leaf B2B Marketplace",
    description:
      "Source premium betel leaves at wholesale prices. Real-time mandi rates, bulk discounts, and same-day dispatch across India.",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a5c2a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            <NavWrapper />
            <MainWrapper>{children}</MainWrapper>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

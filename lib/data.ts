export interface Product {
  id: string
  name: string
  origin: string
  grade: string
  pricePerKg: number
  bulkPricePerKg: number
  bulkMinKg: number
  unit: string
  available: boolean
  description: string
  tag?: string
}

export interface CartItem {
  product: Product
  quantity: number
  isBulk: boolean
}

export interface Order {
  id: string
  date: string
  items: { name: string; quantity: number; pricePerKg: number }[]
  total: number
  status: "processing" | "shipped" | "delivered" | "cancelled"
}

export const products: Product[] = [
  {
    id: "maghai-paan",
    name: "Maghai Paan",
    origin: "Bihar",
    grade: "Premium A+",
    pricePerKg: 1200,
    bulkPricePerKg: 980,
    bulkMinKg: 25,
    unit: "kg",
    available: true,
    description: "Authentic Maghai betel leaves from Bihar. Rich aroma, soft texture, ideal for meetha paan.",
    tag: "Best Seller",
  },
  {
    id: "calcutta-paan",
    name: "Calcutta Paan",
    origin: "West Bengal",
    grade: "Grade A",
    pricePerKg: 950,
    bulkPricePerKg: 780,
    bulkMinKg: 25,
    unit: "kg",
    available: true,
    description: "Classic Calcutta betel leaves. Crisp, dark green, perfect for traditional paan preparations.",
  },
  {
    id: "banarasi-paan",
    name: "Banarasi Paan",
    origin: "Varanasi",
    grade: "Premium A+",
    pricePerKg: 1400,
    bulkPricePerKg: 1150,
    bulkMinKg: 20,
    unit: "kg",
    available: true,
    description: "The legendary Banarasi betel leaf. Unmatched flavor and tenderness for royal paan making.",
    tag: "Premium",
  },
  {
    id: "meetha-paan-leaf",
    name: "Meetha Paan Leaf",
    origin: "Madhya Pradesh",
    grade: "Grade B+",
    pricePerKg: 700,
    bulkPricePerKg: 560,
    bulkMinKg: 30,
    unit: "kg",
    available: true,
    description: "Sweet-flavored betel leaves suited for meetha paan. Budget-friendly wholesale option.",
  },
  {
    id: "desi-paan",
    name: "Desi Paan",
    origin: "Assam",
    grade: "Grade A",
    pricePerKg: 850,
    bulkPricePerKg: 700,
    bulkMinKg: 25,
    unit: "kg",
    available: false,
    description: "Traditional Assamese betel leaves. Strong flavour profile, thick veined leaves.",
  },
  {
    id: "kapuri-paan",
    name: "Kapuri Paan",
    origin: "Karnataka",
    grade: "Premium A",
    pricePerKg: 1100,
    bulkPricePerKg: 900,
    bulkMinKg: 20,
    unit: "kg",
    available: true,
    description: "South Indian Kapuri variety. Aromatic and slightly spicy, prized by connoisseurs.",
    tag: "New Arrival",
  },
]

export const sampleOrders: Order[] = [
  {
    id: "ORD-2026-0041",
    date: "2026-02-17",
    items: [
      { name: "Maghai Paan", quantity: 50, pricePerKg: 980 },
      { name: "Banarasi Paan", quantity: 30, pricePerKg: 1150 },
    ],
    total: 83500,
    status: "shipped",
  },
  {
    id: "ORD-2026-0038",
    date: "2026-02-14",
    items: [
      { name: "Calcutta Paan", quantity: 40, pricePerKg: 780 },
    ],
    total: 31200,
    status: "delivered",
  },
  {
    id: "ORD-2026-0035",
    date: "2026-02-10",
    items: [
      { name: "Meetha Paan Leaf", quantity: 60, pricePerKg: 560 },
      { name: "Kapuri Paan", quantity: 25, pricePerKg: 900 },
    ],
    total: 56100,
    status: "delivered",
  },
  {
    id: "ORD-2026-0029",
    date: "2026-02-05",
    items: [
      { name: "Maghai Paan", quantity: 100, pricePerKg: 980 },
    ],
    total: 98000,
    status: "processing",
  },
]

export const buyerProfile = {
  name: "Rajesh Kumar",
  businessName: "Kumar Paan Traders",
  phone: "+91 98765 43210",
  email: "rajesh@kumarpaan.com",
  gst: "09AABCU9603R1ZM",
  address: "Shop No. 14, Wholesale Market, Lucknow, UP - 226001",
  memberSince: "March 2024",
  totalOrders: 47,
  totalSpent: 892400,
}

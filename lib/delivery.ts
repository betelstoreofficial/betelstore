export interface DeliveryInfo {
  type: "same-day" | "next-day"
  label: string
  deliveryDay: string
  feeNote: string
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Same-day delivery: Mon(1), Wed(3), Fri(5)
// Next-day delivery: Tue(2), Thu(4), Sat(6), Sun(0)
const SAME_DAY_DAYS = new Set([1, 3, 5])

// Map each day to its delivery day index
const NEXT_DELIVERY_DAY: Record<number, number> = {
  0: 1, // Sun -> Mon
  2: 3, // Tue -> Wed
  4: 5, // Thu -> Fri
  6: 1, // Sat -> Mon
}

export function getDeliveryInfo(date?: Date): DeliveryInfo {
  const now = date ?? new Date()
  const dayOfWeek = now.getDay()
  const feeNote = "Delivery fee based on Porter/Rapido charges"

  if (SAME_DAY_DAYS.has(dayOfWeek)) {
    return {
      type: "same-day",
      label: "Same day delivery",
      deliveryDay: DAY_NAMES[dayOfWeek],
      feeNote,
    }
  }

  const nextDay = NEXT_DELIVERY_DAY[dayOfWeek]
  return {
    type: "next-day",
    label: `Next day delivery (${SHORT_DAYS[nextDay]})`,
    deliveryDay: DAY_NAMES[nextDay],
    feeNote,
  }
}

export const DELIVERY_POLICY = "Same day delivery on Mon/Wed/Fri. Next day delivery on other days."

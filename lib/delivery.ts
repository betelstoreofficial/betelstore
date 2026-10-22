export interface DeliveryInfo {
  type: "same-day" | "next-day"
  label: string
  deliveryDay: string
  feeNote: string
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Same-day delivery (Ahmedabad & Gandhinagar): Mon(1), Wed(3), Fri(5),
// for orders placed before 7 PM IST, subject to availability.
const SAME_DAY_DAYS = new Set([1, 3, 5])
const SAME_DAY_CUTOFF_HOUR_IST = 19 // 7 PM IST

// When same-day is not available (other days, or after the 7 PM cutoff),
// the order goes out on the next delivery day.
const NEXT_DELIVERY_DAY: Record<number, number> = {
  0: 1, // Sun -> Mon
  1: 3, // Mon (after cutoff) -> Wed
  2: 3, // Tue -> Wed
  3: 5, // Wed (after cutoff) -> Fri
  4: 5, // Thu -> Fri
  5: 1, // Fri (after cutoff) -> Mon
  6: 1, // Sat -> Mon
}

const FEE_NOTE =
  "Same-day subject to availability. Ahmedabad & Gandhinagar: delivery fee as per Porter/Rapido charges. Rest of India: dispatched within 24 hours by road or rail."

function nowAsIST(): Date {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utcMs + 5.5 * 3600000)
}

// The optional date is interpreted as IST wall-clock time (used for testing).
export function getDeliveryInfo(date?: Date): DeliveryInfo {
  const ist = date ?? nowAsIST()
  const dayOfWeek = ist.getDay()
  const beforeCutoff = ist.getHours() < SAME_DAY_CUTOFF_HOUR_IST

  if (SAME_DAY_DAYS.has(dayOfWeek) && beforeCutoff) {
    return {
      type: "same-day",
      label: "Same day delivery (order before 7 PM)",
      deliveryDay: DAY_NAMES[dayOfWeek],
      feeNote: FEE_NOTE,
    }
  }

  const nextDay = NEXT_DELIVERY_DAY[dayOfWeek]
  return {
    type: "next-day",
    label: `Next day delivery (${SHORT_DAYS[nextDay]})`,
    deliveryDay: DAY_NAMES[nextDay],
    feeNote: FEE_NOTE,
  }
}

export const DELIVERY_POLICY =
  "Ahmedabad and Gandhinagar: same-day delivery by Porter or Rapido on Mon, Wed, Fri for orders placed before 7 PM (subject to availability); next day otherwise. Rest of India: dispatched within 24 hours by road or rail."

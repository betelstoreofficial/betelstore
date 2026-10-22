/** Legacy DB field names are retained; Calcutta price_per_100 is per bharti. */
export function isCalcutta(product: { name: string }) {
  return /calcutta/i.test(product.name)
}
export function quantityRules(product: { name: string }) {
  return isCalcutta(product)
    ? { min: 1, step: 1, divisor: 1, unit: "bharti", rate: "per bharti (350-400 leaves)", shortRate: "bharti" }
    : { min: 100, step: 50, divisor: 100, unit: "leaves", rate: "per 100 leaves", shortRate: "100 leaves" }
}
export function validQuantity(product: { name: string }, qty: number) {
  const { min, step } = quantityRules(product)
  return Number.isSafeInteger(qty) && qty >= min && qty % step === 0
}
export function normalizeQuantity(product: { name: string }, qty: number) {
  const { min, step } = quantityRules(product)
  return Number.isFinite(qty) ? Math.max(min, Math.ceil(qty / step) * step) : min
}
export const CALCUTTA_BULK_MIN = 4
export function bulkMinimum(product: { name: string; bulk_min_qty: number }) {
  return isCalcutta(product) ? CALCUTTA_BULK_MIN : product.bulk_min_qty
}
export function bulkActive(product: { name: string; bulk_min_qty: number }, qty: number, _requested: boolean) {
  return qty >= bulkMinimum(product)
}
export function packagingDescription(product: { name: string }) {
  return isCalcutta(product)
    ? "1 bharti = 350-400 leaves. Minimum order 1 bharti."
    : "1 bundle = 50 leaves. Minimum order 100 leaves (2 bundles)."
}
// Historical orders without a unit snapshot keep their original per-100 basis.
export function orderUnit(item: { pricing_unit?: string }) {
  return item.pricing_unit === "bharti" ? "bharti" : "leaves"
}
export function orderDivisor(item: { pricing_unit?: string }) {
  return item.pricing_unit === "bharti" ? 1 : 100
}
export function orderRateLabel(item: { pricing_unit?: string }) {
  return item.pricing_unit === "bharti" ? "bharti" : "100 leaves"
}
export function linePricing(product: { name: string; price_per_100: number; bulk_price_per_1000: number; bulk_min_qty: number }, qty: number, requested: boolean) {
  const bulk = bulkActive(product, qty, requested)
  const divisor = quantityRules(product).divisor
  const rate = bulk ? (isCalcutta(product) ? Number(product.price_per_100) * 0.95 : Number(product.bulk_price_per_1000) / 10) : Number(product.price_per_100)
  const subtotal = Number(product.price_per_100) * qty / divisor
  const total = rate * qty / divisor
  return { bulk, rate, subtotal, discount: subtotal - total, total }
}

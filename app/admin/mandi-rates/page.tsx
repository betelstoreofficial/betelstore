"use client"

import { useEffect, useState, useCallback } from "react"
import { Save, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MandiRate {
  id: string
  variety: string
  today_price: number
  yesterday_price: number
  change: number
  updated_at: string
}

interface EditableRate extends MandiRate {
  new_today_price: number
}

export default function AdminMandiRatesPage() {
  const [rates, setRates] = useState<EditableRate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchRates = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/mandi-rates")
      .then((res) => res.json())
      .then((data: MandiRate[]) =>
        setRates(
          data.map((r) => ({ ...r, new_today_price: r.today_price })),
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  function updatePrice(id: string, value: number) {
    setRates((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, new_today_price: value } : r,
      ),
    )
  }

  function getPreviewChange(rate: EditableRate) {
    return rate.new_today_price - rate.today_price
  }

  const hasChanges = rates.some((r) => r.new_today_price !== r.today_price)

  async function handleSave() {
    const changed = rates.filter((r) => r.new_today_price !== r.today_price)
    if (changed.length === 0) return

    setSaving(true)
    try {
      const res = await fetch("/api/admin/mandi-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: changed.map((r) => ({ id: r.id, today_price: r.new_today_price })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update rates")
      }
      toast.success(`Updated ${changed.length} rate(s)`)
      fetchRates()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save rates")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">Mandi Rates</h2>
          <p className="text-sm text-muted-foreground">
            Update today&apos;s prices. Yesterday&apos;s price will be set automatically.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
          <Save className="mr-1 h-4 w-4" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variety</TableHead>
              <TableHead className="text-right">Yesterday</TableHead>
              <TableHead className="text-right">Current Today</TableHead>
              <TableHead className="text-right">New Today Price</TableHead>
              <TableHead className="text-right">Change Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No mandi rates found. Run the migration script first.
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => {
                const preview = getPreviewChange(rate)
                const isChanged = rate.new_today_price !== rate.today_price
                return (
                  <TableRow key={rate.id} className={cn("transition-colors hover:bg-accent/50", isChanged && "bg-yellow-50/50")}>
                    <TableCell className="font-medium">{rate.variety}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {"\u20B9"}{rate.yesterday_price.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {"\u20B9"}{rate.today_price.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={rate.new_today_price}
                        onChange={(e) => updatePrice(rate.id, Number(e.target.value))}
                        className="ml-auto w-28 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {isChanged ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                            preview > 0 && "bg-green-100 text-green-800",
                            preview < 0 && "bg-red-100 text-red-800",
                            preview === 0 && "bg-gray-100 text-gray-600",
                          )}
                        >
                          {preview > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : preview < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          {preview > 0 ? "+" : ""}
                          {"\u20B9"}{preview}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {rates.length > 0 && rates[0]?.updated_at && (
        <p className="text-xs text-muted-foreground">
          Last updated:{" "}
          {new Date(rates[0].updated_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  )
}

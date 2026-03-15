"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface MandiRate {
  variety: string
  today_price: number
  yesterday_price: number
  change: number
  updated_at: string
}

export function DailyPriceTable() {
  const [rates, setRates] = useState<MandiRate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mandi-rates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRates(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dateLabel = rates.length > 0 && rates[0].updated_at
    ? new Date(rates[0].updated_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—"

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-border bg-card p-4 duration-400 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-card-foreground">
          Daily Mandi Rates
        </h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {loading ? <Skeleton className="h-3 w-16 inline-block" /> : dateLabel}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left font-medium text-muted-foreground" scope="col">Variety</th>
              <th className="pb-3 text-right font-medium text-muted-foreground" scope="col">Today (per kg)</th>
              <th className="hidden pb-3 text-right font-medium text-muted-foreground sm:table-cell" scope="col">Yesterday</th>
              <th className="pb-3 text-right font-medium text-muted-foreground" scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-3 text-right"><Skeleton className="ml-auto h-4 w-16" /></td>
                  <td className="hidden py-3 text-right sm:table-cell"><Skeleton className="ml-auto h-4 w-16" /></td>
                  <td className="py-3 text-right"><Skeleton className="ml-auto h-4 w-12" /></td>
                </tr>
              ))
            ) : (
              rates.map((row) => (
                <tr
                  key={row.variety}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 font-medium text-card-foreground">{row.variety}</td>
                  <td className="py-3 text-right font-semibold text-card-foreground">
                    {"\u20B9"}{row.today_price.toLocaleString("en-IN")}
                  </td>
                  <td className="hidden py-3 text-right text-muted-foreground sm:table-cell">
                    {"\u20B9"}{row.yesterday_price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        row.change > 0 && "bg-success/10 text-success",
                        row.change < 0 && "bg-destructive/10 text-destructive",
                        row.change === 0 && "bg-secondary text-muted-foreground"
                      )}
                    >
                      {row.change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : row.change < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {row.change > 0 ? "+" : ""}
                      {"\u20B9"}{row.change}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

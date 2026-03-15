"use client"

import { useEffect, useState } from "react"
import { Package, ClipboardList, IndianRupee, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  totalProducts: number
  totalOrders: number
  revenue: number
  pendingOrders: number
}

const statCards = [
  { key: "totalProducts" as const, label: "Total Products", icon: Package, format: (v: number) => v.toString() },
  { key: "totalOrders" as const, label: "Total Orders", icon: ClipboardList, format: (v: number) => v.toString() },
  { key: "revenue" as const, label: "Revenue", icon: IndianRupee, format: (v: number) => `\u20B9${v.toLocaleString("en-IN")}` },
  { key: "pendingOrders" as const, label: "Pending Orders", icon: Clock, format: (v: number) => v.toString() },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {stats ? card.format(stats[card.key]) : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

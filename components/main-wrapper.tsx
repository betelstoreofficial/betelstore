"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  return (
    <main className={cn("min-h-screen", !isAdmin && "pb-24 pt-16 md:pb-8")}>
      {children}
    </main>
  )
}

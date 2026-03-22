"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  return (
    <main className={cn("min-h-screen", !isAdmin && "pb-[calc(6rem+env(safe-area-inset-bottom))] pt-14 md:pb-8 md:pt-16")}>
      {children}
    </main>
  )
}

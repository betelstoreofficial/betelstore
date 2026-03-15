"use client"

import { usePathname } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { BottomNav } from "@/components/bottom-nav"

export function NavWrapper() {
  const pathname = usePathname()

  if (pathname.startsWith("/admin")) return null

  return (
    <>
      <TopNav />
      <BottomNav />
    </>
  )
}

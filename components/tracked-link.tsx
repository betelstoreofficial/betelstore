"use client"

import type { ComponentProps } from "react"
import { track } from "@vercel/analytics"

type TrackedLinkProps = ComponentProps<"a"> & { event: string }

export function TrackedLink({ event, onClick, ...props }: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        try {
          track(event)
        } catch {
          // analytics unavailable
        }
        onClick?.(e)
      }}
    />
  )
}

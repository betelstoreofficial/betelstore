import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle OAuth error from provider
  if (errorParam) {
    const errorMessage = errorDescription || errorParam || "Authentication failed"
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // Successfully authenticated - redirect to the intended destination
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Authentication failed - redirect back to login with error
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message || "Authentication failed")}`
      )
    } catch (err) {
      console.error("OAuth callback error:", err)
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent("An unexpected error occurred during authentication")}`
      )
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent("Invalid authentication request")}`
  )
}

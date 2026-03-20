import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")
  const next = state ? decodeURIComponent(state) : "/"

  // Handle OAuth error from provider
  if (errorParam) {
    const errorMessage = errorDescription || errorParam || "Authentication failed"
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    )
  }

  if (code) {
    try {
      // Exchange Google auth code for tokens directly
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${origin}/auth/callback`,
          grant_type: "authorization_code",
        }),
      })

      const tokens = await tokenRes.json()

      if (tokens.error) {
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(tokens.error_description || tokens.error)}`
        )
      }

      // Sign in to Supabase using the Google ID token
      const supabase = await createClient()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: tokens.id_token,
        access_token: tokens.access_token,
      })

      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }

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

"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, AlertCircle, Loader2 } from "lucide-react"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
        }
      }
    }
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"))
    document.head.appendChild(script)
  })
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      const redirectPath = searchParams.get("redirectTo") || searchParams.get("redirect") || "/"
      router.push(redirectPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }, [searchParams, router])

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const redirectPath = searchParams.get("redirectTo") || searchParams.get("redirect") || "/"
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
      const redirectUri = `${window.location.origin}/auth/callback`
      const state = encodeURIComponent(redirectPath)

      // Direct Google OAuth redirect — shows thebetelstore.com as the origin
      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      googleAuthUrl.searchParams.set("client_id", clientId)
      googleAuthUrl.searchParams.set("redirect_uri", redirectUri)
      googleAuthUrl.searchParams.set("response_type", "code")
      googleAuthUrl.searchParams.set("scope", "openid email profile")
      googleAuthUrl.searchParams.set("state", state)
      googleAuthUrl.searchParams.set("access_type", "offline")
      googleAuthUrl.searchParams.set("prompt", "select_account")

      window.location.href = googleAuthUrl.toString()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize Google sign-in.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-[family-name:var(--font-heading)] text-2xl text-card-foreground">
            Betel Wholesale
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access wholesale prices, place orders, and track deliveries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full gap-3 bg-card text-card-foreground border border-border hover:bg-accent"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

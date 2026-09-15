"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "patient"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login: authLogin } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("[LoginPage] Attempting login", { email, role })

    try {
      await authLogin(email, password)
      // Read stored user to confirm role (authLogin stores merged user in localStorage)
      const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const u = stored ? JSON.parse(stored) : null
      console.log("[LoginPage] Login successful", { userId: u?._id || u?.id, role: u?.role })
      if (u?.role && u.role !== role) {
        console.warn("[LoginPage] Role mismatch", { expected: role, actual: u.role })
        setError(`This account is registered as ${u.role}. Please use the appropriate portal.`)
      } else {
        router.push(`/dashboard`)
      }
    } catch (err) {
      console.error("[LoginPage] Login failed", { error: err })
      setError(err instanceof Error ? err.message : "Login failed")
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-primary/20">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center text-balance">Sign in as {role}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button variant="link" onClick={() => router.push("/signup")} className="p-0">
                Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

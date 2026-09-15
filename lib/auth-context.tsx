"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { login as apiLogin, signup as apiSignup, logout as apiLogout, getUser as getUserFromLS } from "./auth-client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, role: "patient" | "doctor" | "admin") => Promise<void>
  logout: () => void
  updateProfile: (patch: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const existing = getUserFromLS()
    setUser(existing)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    if (!res.success) throw new Error(res.message)
    // Always use backend _id as canonical id
    const merged: User = {
      ...res.user!,
      id: (res.user as any)?._id?.toString?.() || (res.user as any)?.id,
      _id: (res.user as any)?._id?.toString?.() || (res.user as any)?.id,
      name:
        (res.user as any)?.name ||
        [
          (res.user as any)?.firstName || "",
          (res.user as any)?.lastName || "",
        ]
          .join(" ")
          .trim(),
    }
    localStorage.setItem("user", JSON.stringify(merged))
    setUser(merged)
  }

  const signup = async (email: string, password: string, name: string, role: "patient" | "doctor" | "admin") => {
    const fullName = name
    const res = await apiSignup(email, password, fullName, role)
    if (!res.success) throw new Error(res.message)
    const merged: User = {
      ...res.user!,
      id: (res.user as any)?._id?.toString?.() || (res.user as any)?.id,
      _id: (res.user as any)?._id?.toString?.() || (res.user as any)?.id,
      name,
    }
    localStorage.setItem("user", JSON.stringify(merged))
    setUser(merged)
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  const updateProfile = (patch: Partial<User>) => {
    const merged = { ...(getUserFromLS() || {}), ...(patch || {}) }
    localStorage.setItem("user", JSON.stringify(merged))
    setUser(merged as User)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

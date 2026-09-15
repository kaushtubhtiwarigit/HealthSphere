import type { User, AuthResponse } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export async function signup(
  email: string,
  password: string,
  fullName: string,
  role: "patient" | "doctor" | "admin",
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role,
      }),
    })
    const data = await response.json()
    if (data.token) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
    }
    return data
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Signup failed",
    }
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log("[AuthClient] login request", { email })
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    console.log("[AuthClient] login response", { success: data.success, userId: data.user?._id || data.user?.id })
    if (data.token) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
    }
    return data
  } catch (error) {
    console.error("[AuthClient] login error", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    }
  }
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }
  return null
}

export function getAuthHeaders() {
  const token = getToken()
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

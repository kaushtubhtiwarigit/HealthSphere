"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchUsers, deleteUser } from "@/lib/api"
import type { User } from "@/lib/types"
import { Users, Search, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "patient" | "doctor" | "admin">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const loadUsers = async () => {
      try {
        setLoading(true)
        const items = await fetchUsers()
        if (!mounted) return
        setUsers(items)
      } catch (err) {
        console.error("[AdminUsersPage] Failed to load users", err)
        setError("Unable to load users. Please try again later.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUsers()
    return () => {
      mounted = false
    }
  }, [])

  const handleDelete = async (id?: string) => {
    if (!id) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error("[AdminUsersPage] Failed to delete user", err)
      setError("Failed to delete user. Please try again.")
    }
  }

  const filteredUsers = users.filter((u) => {
    const name = (u.name || "").toLowerCase()
    const email = (u.email || "").toLowerCase()
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>
          )}

            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-balance">User Management</h1>
              <p className="text-muted-foreground">Manage all users in the system</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Role</label>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "patient", "doctor", "admin"].map((r) => (
                      <Button
                        key={r}
                        variant={roleFilter === r ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRoleFilter(r as any)}
                        className="capitalize"
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Role</th>
                        <th className="text-left py-3 px-4 font-semibold">Joined</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">{u.name || u.fullName || "Unnamed User"}</td>
                          <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(u.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  )
}

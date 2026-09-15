"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchUsers, fetchAppointments } from "@/lib/api"
import type { User, Appointment } from "@/lib/types"
import { Users, Calendar, LogOut } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [allUsers, allAppointments] = await Promise.all([fetchUsers(), fetchAppointments()])
        if (!mounted) return
        setUsers(allUsers)
        setAppointments(allAppointments)
      } catch (err) {
        console.error("[AdminDashboard] Failed to load data", err)
        setError("Unable to load admin data. Please try again later.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const total = users.length
  const patients = users.filter((u) => u.role === "patient").length
  const doctors = users.filter((u) => u.role === "doctor").length
  const admins = users.filter((u) => u.role === "admin").length

  const userStats = {
    total,
    patients,
    doctors,
    admins,
    pctPatients: total ? Math.round((patients / total) * 100) : 0,
    pctDoctors: total ? Math.round((doctors / total) * 100) : 0,
    pctAdmins: total ? Math.round((admins / total) * 100) : 0,
  }

  const recentUsers = [...users]
    .sort((a, b) => (new Date(b.createdAt || "").getTime() || 0) - (new Date(a.createdAt || "").getTime() || 0))
    .slice(0, 5)

  return (
    <main className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-balance">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">System management and oversight</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="lg" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total}</div>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.patients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.doctors}</div>
            </CardContent>
          </Card>
          <Link href="/dashboard/admin/appointments">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointments.length}</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Users Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users Overview
            </CardTitle>
            <CardDescription>Breakdown by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Patients</p>
                <p className="text-3xl font-bold text-blue-600">{userStats.patients}</p>
                <p className="text-xs text-muted-foreground mt-2">{userStats.pctPatients}% of total</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Doctors</p>
                <p className="text-3xl font-bold text-green-600">{userStats.doctors}</p>
                <p className="text-xs text-muted-foreground mt-2">{userStats.pctDoctors}% of total</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Admins</p>
                <p className="text-3xl font-bold text-purple-600">{userStats.admins}</p>
                <p className="text-xs text-muted-foreground mt-2">{userStats.pctAdmins}% of total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading users...</p>
              ) : recentUsers.length === 0 ? (
                <p className="text-muted-foreground">No users available</p>
              ) : (
                recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="capitalize text-xs bg-primary/10 text-primary px-2 py-1 rounded">{u.role}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointments Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Appointments Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading appointments...</p>
              ) : appointments.length === 0 ? (
                <p className="text-muted-foreground">No appointments available</p>
              ) : (
                appointments.slice(0, 8).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-sm">{apt.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.date).toLocaleDateString()} at {apt.time}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        apt.status === "scheduled"
                          ? "bg-blue-500/10 text-blue-700"
                          : apt.status === "completed"
                            ? "bg-green-500/10 text-green-700"
                            : "bg-red-500/10 text-red-700"
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

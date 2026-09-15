"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAppointments, fetchUsers, updateAppointment } from "@/lib/api"
import type { Appointment, User } from "@/lib/types"
import { Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const [allAppointments, allUsers] = await Promise.all([fetchAppointments(), fetchUsers()])
        if (!mounted) return
        setAppointments(allAppointments)
        setUsers(allUsers)
      } catch (err) {
        console.error("[AdminAppointmentsPage] Failed to load", err)
        setError("Unable to load appointments. Please try again later.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filteredAppointments = appointments.filter((a) => (statusFilter === "all" ? true : a.status === statusFilter))

  const handleStatusChange = async (aptId: string, newStatus: "scheduled" | "completed" | "cancelled") => {
    try {
      const updated = await updateAppointment(aptId, { status: newStatus })
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (err) {
      console.error("[AdminAppointmentsPage] Failed to update status", err)
      setError("Could not update appointment status. Please try again.")
    }
  }

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  }

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
              <h1 className="text-3xl font-bold text-balance">Appointment Management</h1>
              <p className="text-muted-foreground">View and manage all appointments</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                {["all", "scheduled", "completed", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status as any)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Appointments ({filteredAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading appointments...</p>
              ) : filteredAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No appointments found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold">Reason</th>
                        <th className="text-left py-3 px-4 font-semibold">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold">Doctor</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Time</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((apt) => (
                        <tr key={apt.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">{apt.reason}</td>
                          <td className="py-3 px-4">
                            {users.find((u) => u.id === apt.patientId)?.name || apt.patientId || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {users.find((u) => u.id === apt.doctorId)?.name || apt.doctorId || "—"}
                          </td>
                          <td className="py-3 px-4">{new Date(apt.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{apt.time}</td>
                          <td className="py-3 px-4">
                            <select
                              value={apt.status}
                              onChange={(e) => handleStatusChange(apt.id, e.target.value as any)}
                              className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                                apt.status === "scheduled"
                                  ? "bg-blue-500/10 text-blue-700"
                                  : apt.status === "completed"
                                    ? "bg-green-500/10 text-green-700"
                                    : "bg-red-500/10 text-red-700"
                              }`}
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" className="text-xs">
                              View
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

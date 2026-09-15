"use client"

import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import PatientDashboard from "@/components/dashboards/patient-dashboard"
import DoctorDashboard from "@/components/dashboards/doctor-dashboard"
import AdminDashboard from "@/components/dashboards/admin-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      {user?.role === "patient" && <PatientDashboard />}
      {user?.role === "doctor" && <DoctorDashboard />}
      {user?.role === "admin" && <AdminDashboard />}
    </ProtectedRoute>
  )
}

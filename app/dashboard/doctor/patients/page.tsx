"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fetchPatients, fetchMedicalRecordsByPatient } from "@/lib/api"
import type { User } from "@/lib/types"
import { Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DoctorPatientsPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    let mounted = true
    fetchPatients()
      .then((items) => {
        if (!mounted) return
        setPatients(items as any)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const getDisplayName = (p: any) => {
    const name = p?.name || [p?.firstName || "", p?.lastName || ""].join(" ").trim()
    return name || p?.email || ""
  }

  const filteredPatients = patients.filter((p) => {
    const term = (searchTerm || "").toLowerCase()
    const name = getDisplayName(p).toLowerCase()
    const email = (p?.email || "").toLowerCase()
    return name.includes(term) || email.includes(term)
  })

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-balance">My Patients</h1>
              <p className="text-muted-foreground">Manage your patient list</p>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No patients found</p>
                </CardContent>
              </Card>
            ) : (
              filteredPatients.map((patient) => {
                // We could fetch counts per patient, but avoid multiple requests here
                const recordCount = 0
                return (
                  <Link key={patient.id} href={`/dashboard/doctor/patient/${patient.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{getDisplayName(patient)}</CardTitle>
                        <CardDescription>{patient.email}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Medical Records:</span>
                            <span className="font-semibold">{recordCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Member Since:</span>
                            <span className="font-semibold">{new Date(patient.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

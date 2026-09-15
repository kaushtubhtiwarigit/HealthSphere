"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { ClinicalToolsPanel } from "@/components/clinical-tools-panel"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function ClinicalToolsPage() {
  const { user } = useAuth()
  const params = useParams()
  const patientId = params.patientId as string | undefined

  const [patientContext, setPatientContext] = useState<any>(null)

  useEffect(() => {
    if (patientId) {
      // Fetch patient data for context
      fetch(`/api/users/${encodeURIComponent(patientId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            const patient = data.user
            setPatientContext({
              age: patient.dateOfBirth
                ? Math.floor(
                    (Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                  )
                : undefined,
              gender: patient.gender,
              weight: patient.weight,
              medicalHistory: patient.medicalHistory,
              allergies: patient.allergies,
            })
          }
        })
        .catch((err) => console.error("Failed to load patient context", err))
    }
  }, [patientId])

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href={patientId ? `/dashboard/doctor/patient/${patientId}` : "/dashboard"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">AI Clinical Tools</h1>
              <p className="text-muted-foreground mt-2">
                Advanced clinical decision support powered by AI
              </p>
            </div>
          </div>

          <ClinicalToolsPanel patientContext={patientContext} />
        </div>
      </main>
    </ProtectedRoute>
  )
}

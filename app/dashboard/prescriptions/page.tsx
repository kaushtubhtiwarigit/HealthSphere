"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchPrescriptionsByPatient } from "@/lib/api"
import type { Prescription } from "@/lib/types"
import { Pill, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrescriptionsPage() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])

  useEffect(() => {
    const patientId = user?.id || (user as any)?._id?.toString?.()
    if (!patientId) return
    let mounted = true
    fetchPrescriptionsByPatient(patientId)
      .then((items) => {
        if (!mounted) return
        setPrescriptions(items)
      })
      .catch((error) => console.error("[PrescriptionsPage] Failed to load", error))
    return () => {
      mounted = false
    }
  }, [user?.id])

  const isExpired = (expiryDate: Date) => new Date(expiryDate) < new Date()

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-balance">Prescriptions</h1>
              <p className="text-muted-foreground">Manage your medications</p>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <Alert>
                <Pill className="h-4 w-4" />
                <AlertDescription>No prescriptions available</AlertDescription>
              </Alert>
            ) : (
              prescriptions.map((rx) => (
                <Card
                  key={rx.id}
                  className={`hover:shadow-lg transition-shadow ${isExpired(rx.expiryDate) ? "opacity-75" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Pill className="w-5 h-5 mt-1 text-primary" />
                        <div>
                          <CardTitle>{rx.medications.map((m) => m.name).join(" + ")}</CardTitle>
                          <CardDescription>
                            Issued: {new Date(rx.issuedDate).toLocaleDateString()} • Expires:{" "}
                            {new Date(rx.expiryDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {isExpired(rx.expiryDate) && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-semibold">Expired</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rx.medications.map((med, idx) => (
                      <div key={idx} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <h4 className="font-semibold text-base">{med.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Dosage</p>
                            <p className="font-medium">{med.dosage}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Frequency</p>
                            <p className="font-medium">{med.frequency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-medium">{med.duration}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {rx.notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold mb-2">Notes:</h4>
                        <p className="text-muted-foreground text-sm">{rx.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

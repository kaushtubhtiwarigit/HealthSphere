"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchMedicalRecordsByPatient, fetchDoctors, createMedicalRecord } from "@/lib/api"
import type { MedicalRecord, User } from "@/lib/types"
import { FileText, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MedicalRecordsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [notes, setNotes] = useState("")
  const [doctors, setDoctors] = useState<User[]>([])
  const [doctorId, setDoctorId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const patientId = user?.id || (user as any)?._id?.toString?.()
    if (!patientId) return
    let mounted = true
    console.log("[MedicalRecordsPage] Fetching medical records", { patientId })
    fetchMedicalRecordsByPatient(patientId)
      .then((items) => {
        if (!mounted) return
        console.log("[MedicalRecordsPage] Records fetched", { count: items.length })
        setRecords(items)
      })
      .catch((fetchError) => {
        console.error("[MedicalRecordsPage] Failed to fetch records", fetchError)
        setError("Unable to load medical records. Please try again later.")
      })
    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    console.log("[MedicalRecordsPage] Fetching doctors list")
    fetchDoctors()
      .then((items) => {
        if (!mounted) return
        console.log("[MedicalRecordsPage] Doctors fetched", { count: items.length })
        setDoctors(items)
        if (items.length > 0) {
          setDoctorId((prev) => prev || items[0]?.id || "")
        }
      })
      .catch((fetchError) => {
        console.error("[MedicalRecordsPage] Failed to fetch doctors", fetchError)
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const patientId = user?.id || (user as any)?._id?.toString?.()
    setError("")
    console.log("[MedicalRecordsPage] Adding medical record", {
      patientId,
      doctorId,
      diagnosis,
      symptoms,
    })
    if (!patientId || !diagnosis || !doctorId) {
      setError("Missing required information. Please fill out all fields.")
      return
    }

    setLoading(true)
    try {
      const newRecord = await createMedicalRecord({
        patientId,
        doctorId,
        date: new Date(),
        diagnosis,
        symptoms: symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes,
        attachments: [],
      })
      console.log("[MedicalRecordsPage] Record created", { recordId: newRecord.id })
      setRecords((prev) => [newRecord, ...prev])
      setDiagnosis("")
      setSymptoms("")
      setNotes("")
      setDoctorId((prev) => prev || doctorId)
      setShowForm(false)
    } catch (err) {
      console.error("[MedicalRecordsPage] Failed to create record", err)
      setError(err instanceof Error ? err.message : "Could not create medical record")
    } finally {
      setLoading(false)
    }
  }

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-balance">Medical Records</h1>
              <p className="text-muted-foreground">View and manage your health records</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Record
            </Button>
          </div>

          {error && !showForm && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add Record Form */}
          {showForm && (
            <Card className="mb-6 border-primary/50">
              <CardHeader>
                <CardTitle>Add Medical Record</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleAddRecord} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Diagnosis</label>
                    <Input
                      placeholder="e.g., Hypertension"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Doctor</label>
                    <select
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      required
                    >
                      {doctors.length === 0 ? (
                        <option value="" disabled>
                          No doctors available
                        </option>
                      ) : (
                        doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name || doctor.email}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Symptoms (comma-separated)</label>
                    <Input
                      placeholder="e.g., High blood pressure, Headaches"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      className="w-full min-h-24 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Additional notes about the condition"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || doctors.length === 0}>
                      {loading ? "Saving..." : "Save Record"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Records List */}
          <div className="space-y-4">
            {records.length === 0 ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>No medical records yet. Add one to get started.</AlertDescription>
              </Alert>
            ) : (
              records.map((record) => {
                const doctor = doctors.find((d) => d.id === record.doctorId)
                return (
                <Card key={record.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {record.diagnosis}
                        </CardTitle>
                        <CardDescription>
                          {new Date(record.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardDescription>
                        {doctor && <p className="text-sm text-muted-foreground">Doctor: {doctor.name}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {record.symptoms.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Symptoms:</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.symptoms.map((symptom, idx) => (
                            <span key={idx} className="bg-muted px-2 py-1 rounded text-sm">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {record.notes && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Notes:</h4>
                        <p className="text-muted-foreground text-sm">{record.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )
              })
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

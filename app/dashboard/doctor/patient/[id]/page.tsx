"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  fetchPatients,
  fetchMedicalRecordsByPatient,
  fetchDoctors,
  fetchPrescriptionsByPatient,
  createMedicalRecord,
  createPrescription,
} from "@/lib/api"
import type { User, MedicalRecord, Prescription } from "@/lib/types"
import { FileText, Pill, ArrowLeft, Plus, Brain, AlertTriangle } from "lucide-react"
import { MedicalFilesInfoBox } from "@/components/dashboards/medical-files-info-box"
import { VoiceRecorder } from "@/components/voice-recorder"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useParams } from "next/navigation"
import { FullPageLoader } from "@/components/ui/full-page-loader"

export default function PatientDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const patientId = params.id as string
  const { toast } = useToast()

  const [patient, setPatient] = useState<User | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [drugInteractions, setDrugInteractions] = useState<any>(null)
  const [checkingInteractions, setCheckingInteractions] = useState(false)

  // Record form
  const [diagnosis, setDiagnosis] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [notes, setNotes] = useState("")

  // Prescription form
  const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "", duration: "" }])
  const [rxNotes, setRxNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingPatient, setIsLoadingPatient] = useState(true)
  const [patientNotFound, setPatientNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    console.log("[DoctorPatientPage] Loading patient & records", { patientId })
    // Fetch single patient with full details (including medicalFilesInformation)
    setIsLoadingPatient(true)
    setPatientNotFound(false)
    fetch(`/api/users/${encodeURIComponent(patientId)}`)
      .then(async (res) => {
        if (!mounted) return
        if (res.status === 404) {
          setPatient(null)
          setPatientNotFound(true)
          return
        }
        if (!res.ok) throw new Error(`Failed to fetch user ${res.status}`)
        const data = await res.json()
        if (data?.success && data?.user) {
          setPatient({ ...(data.user as any), id: (data.user as any)?._id?.toString?.() || data.user.id })
        }
      })
      .catch((err) => console.error("[DoctorPatientPage] Failed to load patient", err))
      .finally(() => {
        if (mounted) setIsLoadingPatient(false)
      })

    fetchMedicalRecordsByPatient(patientId)
      .then((items) => {
        if (mounted) setRecords(items)
      })
      .catch((err) => console.error("[DoctorPatientPage] Failed to load records", err))
    fetchPrescriptionsByPatient(patientId)
      .then((items) => {
        if (mounted) setPrescriptions(items)
      })
      .catch((err) => console.error("[DoctorPatientPage] Failed to load prescriptions", err))
    return () => {
      mounted = false
    }
  }, [patientId])

  useEffect(() => {
    let mounted = true
    console.log("[DoctorPatientPage] Fetching doctors")
    fetchDoctors()
      .then((items) => {
        if (!mounted) return
        setDoctors(items)
        if (items.length > 0) setSelectedDoctorId(items[0].id || "")
      })
      .catch((err) => console.error("[DoctorPatientPage] Failed to load doctors", err))
    return () => {
      mounted = false
    }
  }, [])

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const doctorId = user?.id || (user as any)?._id?.toString?.() || selectedDoctorId
    console.log("[DoctorPatientPage] Adding record", { patientId, doctorId, diagnosis })
    if (!doctorId || !diagnosis) {
      setError("Missing required information. Please complete all fields.")
      return
    }

    setLoading(true)
    try {
      const created = await createMedicalRecord({
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
      setRecords((prev) => [created, ...prev])
      setDiagnosis("")
      setSymptoms("")
      setNotes("")
      setShowRecordForm(false)
      console.log("[DoctorPatientPage] Record saved", { recordId: created.id })
    } finally {
      setLoading(false)
    }
  }

  // Handle voice transcription completion
  const handleTranscriptionComplete = (processedNotes: any) => {
    console.log("[DoctorPatientPage] Voice transcription completed", processedNotes)
    
    // Auto-populate form fields from processed notes
    if (processedNotes.diagnosis) {
      setDiagnosis((prev) => prev ? `${prev}; ${processedNotes.diagnosis}` : processedNotes.diagnosis)
    }
    if (processedNotes.symptoms && processedNotes.symptoms.length > 0) {
      setSymptoms((prev) => prev ? `${prev}, ${processedNotes.symptoms.join(", ")}` : processedNotes.symptoms.join(", "))
    }
    if (processedNotes.notes) {
      setNotes((prev) => prev ? `${prev}\n\n${processedNotes.notes}` : processedNotes.notes)
    }

    toast({
      title: "Voice notes processed",
      description: "Medical information extracted and added to form",
    })
    setShowVoiceRecorder(false)
  }

  // Check drug interactions before adding prescription
  const checkDrugInteractions = async () => {
    const medicationNames = medications.map(m => m.name).filter(Boolean)
    if (medicationNames.length < 2) {
      return // Need at least 2 medications to check interactions
    }

    setCheckingInteractions(true)
    try {
      const response = await fetch("/api/clinical-tools/drug-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications: medicationNames }),
      })

      if (!response.ok) throw new Error("Failed to check interactions")

      const data = await response.json()
      setDrugInteractions(data)

      // Show warning if interactions found
      if (data.hasInteractions) {
        toast({
          title: "⚠️ Drug Interactions Detected",
          description: `Found ${data.interactions.length} potential interaction(s). Review before prescribing.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "✓ No Interactions",
          description: "No known drug interactions detected",
        })
      }
    } catch (error) {
      console.error("Failed to check drug interactions:", error)
      toast({
        title: "Interaction check failed",
        description: "Could not verify drug interactions. Please review manually.",
        variant: "destructive",
      })
    } finally {
      setCheckingInteractions(false)
    }
  }

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    const doctorId = user?.id || (user as any)?._id?.toString?.() || selectedDoctorId
    console.log("[DoctorPatientPage] Adding prescription", { patientId, doctorId, recordCount: records.length })
    if (!doctorId || !records.length) {
      setError("Create a medical record first before adding a prescription.")
      return
    }

    // Check drug interactions before saving
    await checkDrugInteractions()

    setLoading(true)
    try {
      const latestRecord = records[0]
      const created = await createPrescription({
        recordId: (latestRecord as any).id || (latestRecord as any)._id,
        patientId,
        doctorId,
        medications: medications.filter((m) => m.name),
        notes: rxNotes,
      })
      console.log("[DoctorPatientPage] Prescription created", { prescriptionId: created.id })
      setMedications([{ name: "", dosage: "", frequency: "", duration: "" }])
      setRxNotes("")
      setShowPrescriptionForm(false)
      setPrescriptions((prev) => [created, ...prev])
      setDrugInteractions(null) // Clear interactions after saving
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingPatient) {
    return (
      <ProtectedRoute>
        <FullPageLoader message="Loading patient..." />
      </ProtectedRoute>
    )
  }

  if (!patient && patientNotFound) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Patient not found</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              The patient record you're looking for doesn't exist or may have been removed.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/doctor/patients">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to patients
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/doctor/patients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-balance">{patient?.name || ""}</h1>
              <p className="text-muted-foreground">{patient?.email || ""}</p>
            </div>
          </div>

          {/* Stats + AI Assistant Entry */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Medical Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{records.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prescriptions.length}</div>
              </CardContent>
            </Card>
            {(user?.role === "doctor" || user?.role === "admin") ? (
              <Card className="relative overflow-hidden group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <span>AI Treatment Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Generate context-aware treatment suggestions and ask follow-up questions using the patient's records.
                  </p>
                  <Link href={`/dashboard/doctor/patient/${patientId}/ai-suggestions`}>
                    <Button size="sm" variant="outline" className="gap-2 w-full bg-transparent">
                      Open Assistant
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-5/6 bg-muted rounded" />
                    <div className="h-8 w-full bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Clinical Tools Access */}
          {(user?.role === "doctor" || user?.role === "admin") && (
            <div className="mb-6">
              <Card className="border-primary/30 bg-linear-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Brain className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Clinical Decision Support</h3>
                        <p className="text-sm text-muted-foreground">
                          Differential diagnosis, drug interactions, literature search, and more
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/doctor/clinical-tools?patientId=${patientId}`}>
                      <Button className="gap-2">
                        <Brain className="w-4 h-4" />
                        Open AI Tools
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Patient Profile Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Patient Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{(patient as any)?.bloodGroup || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Allergies</p>
                  <p className="font-medium">{Array.isArray((patient as any)?.allergies) && (patient as any).allergies.length ? (patient as any).allergies.join(", ") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium">{(patient as any)?.gender || "—"}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-muted-foreground text-sm">Medical History</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {Array.isArray((patient as any)?.medicalHistory) && (patient as any).medicalHistory.length ? (
                    (patient as any).medicalHistory.map((m: string, i: number) => <li key={i}>{m}</li>)
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Medical Files */}
          {(patient as any)?.medicalFilesInformation?.length ? (
            <div className="mb-6">
              <MedicalFilesInfoBox files={(patient as any).medicalFilesInformation} />
            </div>
          ) : null}

          {/* Add Record Form */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>
          )}

          {showRecordForm && (
            <Card className="mb-6 border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Medical Record</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    className="gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    {showVoiceRecorder ? "Hide" : "Voice Notes"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showVoiceRecorder && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                  </div>
                )}
                <form onSubmit={handleAddRecord} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Diagnosis</label>
                    <Input
                      placeholder="e.g., Type 2 Diabetes"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      required
                    />
                  </div>

                  {doctors.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assign Doctor</label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      >
                        {doctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name || doc.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Symptoms (comma-separated)</label>
                    <Input
                      placeholder="e.g., Increased thirst, Fatigue"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clinical Notes</label>
                    <textarea
                      className="w-full min-h-24 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Detailed clinical observations"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || doctors.length === 0}>
                      {loading ? "Saving..." : "Save Record"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowRecordForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add Prescription Form */}
          {showPrescriptionForm && (
            <Card className="mb-6 border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Prescription</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={checkDrugInteractions}
                    disabled={checkingInteractions || medications.filter(m => m.name).length < 2}
                    className="gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    {checkingInteractions ? "Checking..." : "Check Interactions"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Drug Interaction Warning */}
                {drugInteractions && drugInteractions.hasInteractions && (
                  <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-destructive mb-2">
                          Drug Interactions Detected ({drugInteractions.interactions.length})
                        </h4>
                        <div className="space-y-3">
                          {drugInteractions.interactions.map((interaction: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <p className="font-medium">{interaction.drugs.join(" + ")}</p>
                              <p className="text-muted-foreground mt-1">{interaction.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  interaction.severity === "severe" 
                                    ? "bg-destructive text-destructive-foreground"
                                    : interaction.severity === "moderate"
                                    ? "bg-orange-500 text-white"
                                    : "bg-yellow-500 text-black"
                                }`}>
                                  {interaction.severity.toUpperCase()}
                                </span>
                                {interaction.recommendation && (
                                  <span className="text-xs text-muted-foreground">
                                    {interaction.recommendation}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddPrescription} className="space-y-4">
                  <div className="space-y-3">
                    {medications.map((med, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium">Medication Name</label>
                            <Input
                              placeholder="e.g., Metformin"
                              value={med.name}
                              onChange={(e) => {
                                const newMeds = [...medications]
                                newMeds[idx].name = e.target.value
                                setMedications(newMeds)
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Dosage</label>
                            <Input
                              placeholder="e.g., 500mg"
                              value={med.dosage}
                              onChange={(e) => {
                                const newMeds = [...medications]
                                newMeds[idx].dosage = e.target.value
                                setMedications(newMeds)
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Frequency</label>
                            <Input
                              placeholder="e.g., Twice daily"
                              value={med.frequency}
                              onChange={(e) => {
                                const newMeds = [...medications]
                                newMeds[idx].frequency = e.target.value
                                setMedications(newMeds)
                              }}
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium">Duration</label>
                            <Input
                              placeholder="e.g., 30 days"
                              value={med.duration}
                              onChange={(e) => {
                                const newMeds = [...medications]
                                newMeds[idx].duration = e.target.value
                                setMedications(newMeds)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() =>
                      setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }])
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <textarea
                      className="w-full min-h-20 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Additional instructions"
                      value={rxNotes}
                      onChange={(e) => setRxNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || !medications.some((m) => m.name)}>
                      {loading ? "Creating..." : "Create Prescription"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowPrescriptionForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!showRecordForm && !showPrescriptionForm && (
            <div className="flex gap-3 mb-8">
              <Button onClick={() => setShowRecordForm(true)} className="gap-2">
                <FileText className="w-4 h-4" />
                Add Record
              </Button>
              <Button
                onClick={() => setShowPrescriptionForm(true)}
                variant="outline"
                className="gap-2"
                disabled={records.length === 0}
              >
                <Pill className="w-4 h-4" />
                Create Prescription
              </Button>
            </div>
          )}

          {/* Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Medical Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-muted-foreground">No medical records yet</p>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div key={record.id} className="border border-border rounded-lg p-4">
                      <h3 className="font-semibold text-lg">{record.diagnosis}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{new Date(record.date).toLocaleDateString()}</p>
                      {record.symptoms.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium mb-1">Symptoms:</p>
                          <div className="flex flex-wrap gap-2">
                            {record.symptoms.map((symptom, idx) => (
                              <span key={idx} className="bg-muted px-2 py-1 rounded text-xs">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p className="text-muted-foreground">No prescriptions yet</p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{rx.medications.map((m) => m.name).join(", ")}</h3>
                          <p className="text-sm text-muted-foreground">
                            Issued {new Date(rx.issuedDate).toLocaleDateString()} • Expires {new Date(
                              rx.expiryDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        {rx.medications.map((med, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-3">
                            <span className="font-medium">{med.name}</span>
                            <span className="text-muted-foreground">
                              {med.dosage} • {med.frequency} • {med.duration}
                            </span>
                          </div>
                        ))}
                        {rx.notes && <p className="text-muted-foreground">Notes: {rx.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  )
}

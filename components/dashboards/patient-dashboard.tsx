import React, { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  fetchMedicalRecordsByPatient,
  fetchPrescriptionsByPatient,
  fetchAppointmentsByPatient,
} from "@/lib/api"
import type { MedicalRecord, Prescription, Appointment, MedicalFileInfo } from "@/lib/types"

import { LogOut, FileText, Pill, Calendar, Save, UploadCloud, X } from "lucide-react"
import Link from "next/link"
import { MedicalFilesInfoBox } from "../dashboards/medical-files-info-box"
import { AppointmentCountdownCard } from "../appointment-countdown-card"
import { 
  DashboardStatsSkeleton, 
  MedicalRecordsListSkeleton, 
  PrescriptionsListSkeleton, 
  AppointmentsListSkeleton 
} from "@/components/ui/loading-skeletons"

export default function PatientDashboard() {
  // Upload modal state and handlers
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { user, logout, updateProfile } = useAuth()
  const [medicalFilesInfo, setMedicalFilesInfo] = useState<MedicalFileInfo[]>(
    (user as any)?.medicalFilesInformation || []
  )

  // Fetch fresh user data from MongoDB on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = user?.id || (user as any)?._id?.toString?.()
      if (!userId) {
        console.log("[PatientDashboard] No userId available for fetch")
        return
      }

      try {
        console.log("[PatientDashboard] Fetching user data for:", userId)
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          console.log("[PatientDashboard] Fetched user data:", {
            success: data.success,
            hasMedicalFiles: !!data.user?.medicalFilesInformation,
            medicalFilesCount: data.user?.medicalFilesInformation?.length || 0
          })
          if (data.success && data.user) {
            // Update medical files from MongoDB
            const files = data.user.medicalFilesInformation || []
            console.log("[PatientDashboard] Setting medical files:", files.length, "items")
            setMedicalFilesInfo(files)
            // Update auth context with fresh data
            updateProfile(data.user)
          }
        } else {
          console.error("[PatientDashboard] Failed to fetch user data:", res.status)
        }
      } catch (error) {
        console.error("[PatientDashboard] Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [user?.id])

  // Helper to refresh user data from server
  const refreshUserData = async () => {
    const userId = user?.id || (user as any)?._id?.toString?.()
    if (!userId) return

    try {
      console.log("[PatientDashboard] Refreshing user data after upload")
      const res = await fetch(`/api/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        console.log("[PatientDashboard] Refreshed data - medical files count:", data.user?.medicalFilesInformation?.length || 0)
        if (data.success && data.user) {
          setMedicalFilesInfo(data.user.medicalFilesInformation || [])
          updateProfile(data.user)
        }
      }
    } catch (error) {
      console.error("[PatientDashboard] Failed to refresh user data:", error)
    }
  }

  // Sync medical files state when user changes
  useEffect(() => {
    setMedicalFilesInfo((user as any)?.medicalFilesInformation || [])
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setUploadError(null)
    }
  }

  const handleUploadClose = () => {
    setShowUploadForm(false)
    setSelectedFile(null)
    setUploadError(null)
  }

  const [fileCategory, setFileCategory] = useState<string>("other")

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError("Please select a file to upload.")
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("patientId", user?.id || (user as any)?._id?.toString?.() || "")
      formData.append("category", fileCategory)
      const res = await fetch("/api/medical-files", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      console.log("Medical file upload API response:", data)
      if (!res.ok || !data.success) {
        setUploadError(data.message || "Failed to upload file.")
        toast({ 
          title: "❌ Upload failed", 
          description: data.message || "Failed to upload file.",
          variant: "destructive"
        })
      } else {
        // Update local state immediately with the saved item
        if (data.savedItem) {
          setMedicalFilesInfo(prev => [data.savedItem, ...prev])
        }
        // Also refresh from server to ensure consistency
        await refreshUserData()
        toast({ 
          title: "✅ File uploaded successfully", 
          description: "Your medical file has been uploaded and processed."
        })
        setShowUploadForm(false)
        setSelectedFile(null)
      }
    } catch (err) {
      setUploadError("Failed to upload file.")
      toast({ 
        title: "❌ Upload error", 
        description: "An unexpected error occurred while uploading.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }
  const profileRef = useRef<HTMLDivElement | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [bloodGroup, setBloodGroup] = useState<string>((user as any)?.bloodGroup || "")
  const [allergiesInput, setAllergiesInput] = useState<string>((user as any)?.allergies?.join(", ") || "")
  const [medicalHistoryInput, setMedicalHistoryInput] = useState<string>((user as any)?.medicalHistory?.join("\n") || "")
  const [savingProfile, setSavingProfile] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  // Plain-language summaries state per medical record
  const [recordSummaries, setRecordSummaries] = useState<Record<string, { loading: boolean; data?: { title: string; summary: string; disclaimer: string }; error?: string }>>({})
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const patientId = user?.id || (user as any)?._id?.toString?.()
    if (!patientId) return
    let mounted = true

    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const [recordsData, prescriptionsData, appointmentsData] = await Promise.all([
          fetchMedicalRecordsByPatient(patientId),
          fetchPrescriptionsByPatient(patientId),
          fetchAppointmentsByPatient(patientId),
        ])
        if (!mounted) return
        setRecords(recordsData)
        setPrescriptions(prescriptionsData)
        setAppointments(appointmentsData)
      } catch (error) {
        console.error("[PatientDashboard] Failed to load data", error)
        toast({ 
          title: "Error loading data", 
          description: "Failed to load your medical data. Please try refreshing the page.",
          variant: "destructive"
        })
      } finally {
        if (mounted) setIsLoadingData(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [user?.id])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleOpenProfile = () => {
    if (!showProfileForm) {
      setShowProfileForm(true)
      // wait for the form to render then scroll
      setTimeout(() => {
        if (profileRef.current) profileRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 80)
    } else {
      if (profileRef.current) profileRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    setSavingProfile(true)
    try {
      const payload: any = {
        bloodGroup: bloodGroup || undefined,
        allergies: allergiesInput ? allergiesInput.split(",").map((s) => s.trim()).filter(Boolean) : [],
        medicalHistory: medicalHistoryInput ? medicalHistoryInput.split(/\n+/).map((s) => s.trim()).filter(Boolean) : [],
      }
      // Try server update first; fallback to local save for mock/local mode
      try {
        const updated = await (await import("@/lib/api")).updateUser(user.id!, payload)
        updateProfile(updated)
        setProfileSaved(true)
        setShowProfileForm(false)
        toast({ 
          title: "✅ Profile updated", 
          description: "Your medical information has been successfully saved."
        })
      } catch (err) {
        console.warn("[PatientDashboard] server update failed, falling back to local storage", err)
        const { saveUser } = await import("@/lib/storage")
        const merged = { ...(user as any), ...payload }
        saveUser(merged)
        updateProfile(merged)
        setProfileSaved(true)
        setShowProfileForm(false)
        toast({ 
          title: "✅ Profile saved", 
          description: "Saved to local storage."
        })
      }
    } catch (error) {
      console.error("[PatientDashboard] Failed to save profile", error)
      toast({ 
        title: "❌ Error", 
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const upcomingAppointments = appointments.filter((a) => a.status === "scheduled").length


  return (
    <main className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-balance">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-3">
              <span>Manage your health records and appointments</span>
              {((user as any)?.bloodGroup || null) && (
                <span className="text-sm px-2 py-1 rounded-md bg-muted/60 text-foreground">Blood: {(user as any).bloodGroup}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenProfile} variant="secondary" size="lg" className="gap-2">
              Update Profile
            </Button>
            <Button onClick={() => setShowUploadForm(true)} variant="secondary" size="lg" className="gap-2">
              Upload Medical Files
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg" className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats - All Clickable */}
        {isLoadingData ? (
          <DashboardStatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/dashboard/medical-records">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Medical Records</span>
                    <FileText className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{records.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/prescriptions">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Active Prescriptions</span>
                    <Pill className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{prescriptions.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/appointments">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>Upcoming</span>
                    <Calendar className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAppointments}</div>
                  <p className="text-xs text-muted-foreground mt-1">Appointments</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Appointment Countdown - Prominent placement */}
        {appointments.filter((a) => a.status === "scheduled").length > 0 && (
          <div className="mb-8">
            <AppointmentCountdownCard
              appointment={appointments.filter((a) => a.status === "scheduled")[0]}
              onUpdate={(updatedAppointment) => {
                // Update appointments list
                setAppointments((prev) =>
                  prev.map((apt) =>
                    (apt.id === updatedAppointment.id || apt._id === updatedAppointment._id)
                      ? updatedAppointment
                      : apt
                  )
                )
              }}
              onCancel={(appointmentId) => {
                // Refresh appointments list
                const patientId = user?.id || (user as any)?._id?.toString?.()
                if (patientId) {
                  fetchAppointmentsByPatient(patientId).then(setAppointments)
                }
                toast({
                  title: "Appointment cancelled",
                  description: "Your appointment has been cancelled successfully.",
                })
              }}
            />
          </div>
        )}

        {/* Upload Medical Files Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-background rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={handleUploadClose}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UploadCloud className="w-6 h-6 text-primary" />
                  <h2 className="text-lg font-semibold">Upload Medical File</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Upload images of medical tests, results, etc. (JPG, PNG, PDF)</p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm"
                  disabled={uploading}
                />
                <div>
                  <label className="text-xs font-medium block mb-1">Category</label>
                  <select
                    value={fileCategory}
                    onChange={(e) => setFileCategory(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm bg-background"
                    disabled={uploading}
                  >
                    <option value="lab_result">Lab Result</option>
                    <option value="imaging">Imaging / Scan</option>
                    <option value="prescription">Prescription</option>
                    <option value="referral">Referral</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {selectedFile && (
                  <div className="text-xs mt-1">Selected: {selectedFile.name}</div>
                )}
                {uploadError && <div className="text-red-500 text-xs">{uploadError}</div>}
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={uploading} className="gap-2">
                    <UploadCloud className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleUploadClose} disabled={uploading}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Profile Section (render only when requested) */}
        {showProfileForm && (
          <div className="mb-8" ref={profileRef}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Update Profile
                </CardTitle>
                <CardDescription>Update your medical information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Input
                      id="bloodGroup"
                      value={bloodGroup}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBloodGroup(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies (comma separated)</Label>
                    <Input
                      id="allergies"
                      value={allergiesInput}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllergiesInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory">Medical History (one per line)</Label>
                    <textarea
                      id="medicalHistory"
                      className="w-full rounded border border-border p-2 min-h-[100px]"
                      value={medicalHistoryInput}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMedicalHistoryInput(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                      <Save className="w-4 h-4" />
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Medical Records */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Medical Records
              </CardTitle>
              <CardDescription>Your recent health history</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <MedicalRecordsListSkeleton />
              ) : records.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No medical records yet</p>
              ) : (
                <div className="space-y-4">{records.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{record.diagnosis}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      {record.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {record.symptoms.slice(0, 2).map((symptom, idx) => (
                            <span key={idx} className="bg-muted text-xs px-2 py-1 rounded">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* AI Summary Action */}
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                          disabled={!!recordSummaries[record.id || ""]?.loading}
                          onClick={async () => {
                            const recId = record.id || ""
                            setRecordSummaries((prev) => ({ ...prev, [recId]: { loading: true } }))
                            try {
                              const res = await fetch("/api/ai-record-summary", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  diagnosis: record.diagnosis,
                                  symptoms: record.symptoms,
                                  notes: record.notes || "",
                                }),
                              })
                              const data = await res.json()
                              if (!res.ok || !data.success) {
                                throw new Error(data.message || "Failed to generate summary")
                              }
                              setRecordSummaries((prev) => ({
                                ...prev,
                                [recId]: { loading: false, data: data.data },
                              }))
                            } catch (err: any) {
                              setRecordSummaries((prev) => ({
                                ...prev,
                                [recId]: { loading: false, error: err.message || "Error" },
                              }))
                            }
                          }}
                        >
                          {recordSummaries[record.id || ""]?.loading ? "Summarizing…" : "Explain in simple terms"}
                        </Button>
                      </div>
                      {/* Summary Display */}
                      {recordSummaries[record.id || ""]?.data && (
                        <div className="mt-3 text-xs space-y-2 bg-muted/40 rounded p-3 border border-border/50">
                          <strong className="block text-sm">{recordSummaries[record.id || ""]!.data!.title}</strong>
                          <pre className="whitespace-pre-wrap leading-relaxed font-sans text-[11px]">{recordSummaries[record.id || ""]!.data!.summary}</pre>
                          <p className="text-[10px] text-muted-foreground italic">
                            {recordSummaries[record.id || ""]!.data!.disclaimer}
                          </p>
                        </div>
                      )}
                      {recordSummaries[record.id || ""]?.error && (
                        <p className="mt-2 text-[10px] text-red-500">{recordSummaries[record.id || ""]!.error}</p>
                      )}
                    </div>
                  ))}
                  {records.length > 3 && (
                    <Link href="/dashboard/medical-records">
                      <Button variant="outline" className="w-full text-xs bg-transparent">
                        View all {records.length} records
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4">
            {/* Appointments Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <AppointmentsListSkeleton />
                ) : appointments.filter((a) => a.status === "scheduled").length === 0 ? (
                  <p className="text-muted-foreground text-sm">No appointments scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {appointments
                      .filter((a) => a.status === "scheduled")
                      .slice(0, 2)
                      .map((apt) => (
                        <div key={apt.id} className="border border-border rounded p-2">
                          <p className="font-semibold text-sm">{apt.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.date).toLocaleDateString()} at {apt.time}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
                <Link href="/dashboard/appointments" className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
                    Manage appointments
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pill className="w-5 h-5" />
                  Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <PrescriptionsListSkeleton />
                ) : prescriptions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No active prescriptions</p>
                ) : (
                  <div className="space-y-2">
                    {prescriptions.slice(0, 2).map((rx) => (
                      <div key={rx.id} className="text-sm">
                        <p className="font-semibold">{rx.medications[0]?.name}</p>
                        <p className="text-xs text-muted-foreground">{rx.medications[0]?.dosage}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/prescriptions" className="mt-3 block">
                  <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
                    View prescriptions
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Medical Summary - show after profile updated */}
            {profileSaved && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Medical Summary</CardTitle>
                  <CardDescription className="text-xs">Your saved medical information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Blood Group:</strong> {(user as any)?.bloodGroup || "—"}
                    </div>
                    <div>
                      <strong>Allergies:</strong>{" "}
                      {((user as any)?.allergies && (user as any).allergies.length > 0) ? (user as any).allergies.join(", ") : "—"}
                    </div>
                    <div>
                      <strong>Medical History:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {((user as any)?.medicalHistory && (user as any).medicalHistory.length > 0) ? (
                          (user as any).medicalHistory.map((m: string, i: number) => <li key={i}>{m}</li>)
                        ) : (
                          <li>—</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Files Information - show if any */}
            {medicalFilesInfo && medicalFilesInfo.length > 0 ? (
              <MedicalFilesInfoBox files={medicalFilesInfo} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Uploaded Medical Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">No medical files uploaded yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

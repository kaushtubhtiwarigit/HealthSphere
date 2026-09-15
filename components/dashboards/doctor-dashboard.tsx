"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchMedicalRecordsByDoctor,
  fetchAppointmentsByDoctor,
  fetchPatients,
  fetchPrescriptionsByDoctor,
  updateUser,
} from "@/lib/api"
import { fetchUserById } from "@/lib/get-user"
import type { MedicalRecord, Appointment, User, Prescription } from "@/lib/types"
import { Stethoscope, Calendar, Users, LogOut, Pill, BarChart3, Brain, Image as ImageIcon } from "lucide-react"
import Link from "next/link"


export default function DoctorDashboard() {
  const { user, logout, updateProfile } = useAuth()
  const router = useRouter()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<User[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  // Time slots: 9:00 to 20:00 (8pm)
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${(9 + i).toString().padStart(2, "0")}:00`)
  // Store available slots as a Set
  const [availableSlots, setAvailableSlots] = useState<Set<string>>(new Set())
  const [savingSlots, setSavingSlots] = useState(false)

  // Load available slots from user profile on mount
  useEffect(() => {
    if (user && (user as any).availableSlots) {
      console.log('[DoctorDashboard] Loading availableSlots from user:', (user as any).availableSlots)
      // availableSlots: [{ day: 'any', startTime: '09:00', endTime: '09:59' }, ...]
      const slots = (user as any).availableSlots as Array<{ startTime: string }>
      if (Array.isArray(slots)) {
        setAvailableSlots(new Set(slots.map((s) => s.startTime)))
      }
    } else {
      console.log('[DoctorDashboard] No availableSlots found on user:', user)
    }
  }, [user])

  // Save available slots to backend
  const saveSlots = async (slots: Set<string>) => {
    // Always use MongoDB _id for backend API calls
    const userId = (user as any)?._id?.toString?.()
    console.log('[DoctorDashboard] saveSlots called. userId:', userId, 'slots:', Array.from(slots))
    if (!userId) {
      console.error('[DoctorDashboard] No userId found for saveSlots')
      return
    }
    setSavingSlots(true)
    try {
      // Save as array of { day: 'any', startTime, endTime }
      const slotArr = Array.from(slots).map((startTime) => ({ day: 'any', startTime, endTime: startTime }))
      console.log('[DoctorDashboard] PATCH /api/users/', userId, 'payload:', slotArr)
      await updateUser(userId, { availableSlots: slotArr })
      // Fetch latest user profile and update auth context
      const latestUser = await fetchUserById(userId)
      updateProfile(latestUser)
      console.log('[DoctorDashboard] Slots saved successfully and user profile updated')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[DoctorDashboard] Failed to save slots', err)
    } finally {
      setSavingSlots(false)
    }
  }

  // Toggle slot availability and persist
  const handleSlotToggle = (slot: string) => {
    setAvailableSlots((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(slot)) {
        newSet.delete(slot)
      } else {
        newSet.add(slot)
      }
      // Save to backend
      saveSlots(newSet)
      return newSet
    })
  }

  useEffect(() => {
    const doctorId = (user as any)?._id?.toString?.()
    if (!doctorId) return
    let mounted = true

    const loadData = async () => {
      try {
        const [recordsData, appointmentsData, prescriptionsData] = await Promise.all([
          fetchMedicalRecordsByDoctor(doctorId),
          fetchAppointmentsByDoctor(doctorId),
          fetchPrescriptionsByDoctor(doctorId),
        ])
        if (!mounted) return
        setRecords(recordsData)
        setAppointments(appointmentsData)
        setPrescriptions(prescriptionsData)
      } catch (error) {
        console.error("[DoctorDashboard] Failed to load doctor data", error)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [user?._id])

  useEffect(() => {
    let mounted = true
    fetchPatients()
      .then((items) => {
        if (!mounted) return
        setPatients(items)
      })
      .catch((error) => {
        console.error("[DoctorDashboard] Failed to load patients", error)
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-balance">{user?.name}</h1>
            <p className="text-muted-foreground mt-2">Manage patients and prescriptions</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/doctor/clinical-tools">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <Brain className="w-4 h-4" />
                AI Tools
              </Button>
            </Link>
            <Link href="/dashboard/doctor/image-analysis">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <ImageIcon className="w-4 h-4" />
                Image Analysis
              </Button>
            </Link>
            <Link href="/dashboard/doctor/analytics">
              <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="lg" className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Doctor Availability Slots */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Set Your Available Time Slots</h2>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`px-3 py-1 rounded font-mono text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  availableSlots.has(slot)
                    ? "bg-green-500 text-white border-green-600 hover:bg-green-600"
                    : "bg-red-500 text-white border-red-600 hover:bg-red-600"
                }`}
                onClick={() => handleSlotToggle(slot)}
                disabled={savingSlots}
              >
                {slot}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Click a time to toggle your availability. Green = available, Red = unavailable.</p>
          {savingSlots && <p className="text-xs text-primary mt-1">Saving...</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/doctor/patients">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
              </CardContent>
            </Card>
          </Link>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Records */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Recent Medical Records
              </CardTitle>
              <CardDescription>Records created by you</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-muted-foreground">No records created yet</p>
              ) : (
                <div className="space-y-4">
                  {records.slice(0, 5).map((record) => {
                    const patient = patients.find((p) => p.id === record.patientId)
                    return (
                      <div key={record.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{record.diagnosis}</h3>
                            <p className="text-sm text-muted-foreground">
                              Patient: {patient?.name || record.patientId} • {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-muted-foreground">No appointments scheduled</p>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((apt) => {
                    const patient = patients.find((p) => p.id === apt.patientId)
                    return (
                      <div key={apt.id} className="border border-border rounded-lg p-3">
                        <p className="font-semibold text-sm">{apt.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(apt.date).toLocaleDateString()} at {apt.time}
                        </p>
                        {patient && (
                          <p className="text-xs text-muted-foreground mt-1">Patient: {patient.name}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                Recent Prescriptions
              </CardTitle>
              <CardDescription>Latest medications issued</CardDescription>
            </CardHeader>
            <CardContent>
              {prescriptions.length === 0 ? (
                <p className="text-muted-foreground">No prescriptions issued yet</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.slice(0, 5).map((rx) => {
                    const patient = patients.find((p) => p.id === rx.patientId)
                    const firstMed = rx.medications[0]
                    return (
                      <div key={rx.id} className="border border-border rounded-lg p-3">
                        <p className="font-semibold text-sm">{firstMed?.name || "Medication"}</p>
                        <p className="text-xs text-muted-foreground">
                          {firstMed?.dosage} • {firstMed?.frequency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued {new Date(rx.issuedDate).toLocaleDateString()}
                          {patient ? ` • Patient: ${patient.name}` : ""}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patients List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Patients
              </CardTitle>
              <CardDescription>Click on a patient to view details and add records</CardDescription>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <p className="text-muted-foreground">No patients assigned</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map((patient) => (
                    <Link key={patient.id} href={`/dashboard/doctor/patient/${patient.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="pt-6">
                          <p className="font-semibold">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Member since {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "—"}
                          </p>
                          <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                            AI Suggestions
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

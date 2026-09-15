// Client-side storage utilities for managing app data
import type { User, MedicalRecord, Prescription, Appointment } from "./types"

const STORAGE_KEYS = {
  users: "hms_users",
  currentUser: "hms_current_user",
  medicalRecords: "hms_medical_records",
  prescriptions: "hms_prescriptions",
  appointments: "hms_appointments",
}

// Initialize with mock data
export function initializeMockData() {
  if (typeof window === "undefined") return

  const existingUsers = localStorage.getItem(STORAGE_KEYS.users)
  if (existingUsers) return

  const mockUsers: any[] = [
    {
      id: "patient1",
      email: "john@example.com",
      password: "password123",
      name: "John Doe",
        role: "patient",
        bloodGroup: "A+",
        allergies: ["Peanuts"],
        medicalHistory: ["Hypertension"],
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "patient2",
      email: "jane@example.com",
      password: "password123",
      name: "Jane Smith",
        role: "patient",
        bloodGroup: "O-",
        allergies: [],
        medicalHistory: ["Asthma"],
      createdAt: new Date("2024-02-20"),
    },
    {
      id: "doctor1",
      email: "dr.smith@example.com",
      password: "password123",
      name: "Dr. James Smith",
      role: "doctor",
      createdAt: new Date("2023-06-10"),
    },
    {
      id: "doctor2",
      email: "dr.johnson@example.com",
      password: "password123",
      name: "Dr. Sarah Johnson",
      role: "doctor",
      createdAt: new Date("2023-08-15"),
    },
    {
      id: "admin1",
      email: "admin@example.com",
      password: "password123",
      name: "Admin User",
      role: "admin",
      createdAt: new Date("2023-01-01"),
    },
  ]

  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers))

  // Mock medical records
  const mockRecords: MedicalRecord[] = [
    {
      id: "record1",
      patientId: "patient1",
      doctorId: "doctor1",
      date: new Date("2024-11-01"),
      diagnosis: "Hypertension",
      symptoms: ["High blood pressure", "Headaches"],
      notes: "Patient to follow up in 2 weeks",
      attachments: [],
    },
    {
      id: "record2",
      patientId: "patient1",
      doctorId: "doctor2",
      date: new Date("2024-10-15"),
      diagnosis: "Allergic Rhinitis",
      symptoms: ["Nasal congestion", "Sneezing"],
      notes: "Prescribed antihistamines",
      attachments: [],
    },
  ]

  localStorage.setItem(STORAGE_KEYS.medicalRecords, JSON.stringify(mockRecords))

  // Mock prescriptions
  const mockPrescriptions: Prescription[] = [
    {
      id: "rx1",
      recordId: "record1",
      patientId: "patient1",
      doctorId: "doctor1",
      medications: [{ name: "Lisinopril", dosage: "10mg", frequency: "Once daily", duration: "30 days" }],
      notes: "Take with food",
      issuedDate: new Date("2024-11-01"),
      expiryDate: new Date("2025-05-01"),
    },
  ]

  localStorage.setItem(STORAGE_KEYS.prescriptions, JSON.stringify(mockPrescriptions))

  // Mock appointments
  const mockAppointments: Appointment[] = [
    {
      id: "apt1",
      patientId: "patient1",
      doctorId: "doctor1",
      date: new Date("2024-11-20"),
      time: "10:00 AM",
      status: "scheduled",
      notes: "Follow-up for hypertension",
      reason: "Hypertension Follow-up",
    },
  ]

  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(mockAppointments))
}

// User storage functions
export function saveUser(user: User) {
  const users = getAllUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)
  if (existingIndex > -1) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
}

export function getAllUsers(): User[] {
  if (typeof window === "undefined") return []
  const users = localStorage.getItem(STORAGE_KEYS.users)
  return users ? JSON.parse(users) : []
}

export function getUserByEmail(email: string): User | undefined {
  return getAllUsers().find((u) => u.email === email)
}

export function getUserById(id: string): User | undefined {
  return getAllUsers().find((u) => u.id === id)
}

// Current user session
export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser)
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem(STORAGE_KEYS.currentUser)
  return user ? JSON.parse(user) : null
}

// Medical records
export function saveMedicalRecord(record: MedicalRecord) {
  const records = getAllMedicalRecords()
  const existingIndex = records.findIndex((r) => r.id === record.id)
  if (existingIndex > -1) {
    records[existingIndex] = record
  } else {
    records.push(record)
  }
  localStorage.setItem(STORAGE_KEYS.medicalRecords, JSON.stringify(records))
}

export function getAllMedicalRecords(): MedicalRecord[] {
  if (typeof window === "undefined") return []
  const records = localStorage.getItem(STORAGE_KEYS.medicalRecords)
  return records ? JSON.parse(records) : []
}

export function getMedicalRecordsByPatient(patientId: string): MedicalRecord[] {
  return getAllMedicalRecords().filter((r) => r.patientId === patientId)
}

export function getMedicalRecordsByDoctor(doctorId: string): MedicalRecord[] {
  return getAllMedicalRecords().filter((r) => r.doctorId === doctorId)
}

// Prescriptions
export function savePrescription(prescription: Prescription) {
  const prescriptions = getAllPrescriptions()
  const existingIndex = prescriptions.findIndex((p) => p.id === prescription.id)
  if (existingIndex > -1) {
    prescriptions[existingIndex] = prescription
  } else {
    prescriptions.push(prescription)
  }
  localStorage.setItem(STORAGE_KEYS.prescriptions, JSON.stringify(prescriptions))
}

export function getAllPrescriptions(): Prescription[] {
  if (typeof window === "undefined") return []
  const prescriptions = localStorage.getItem(STORAGE_KEYS.prescriptions)
  return prescriptions ? JSON.parse(prescriptions) : []
}

export function getPrescriptionsByPatient(patientId: string): Prescription[] {
  return getAllPrescriptions().filter((p) => p.patientId === patientId)
}

// Appointments
export function saveAppointment(appointment: Appointment) {
  const appointments = getAllAppointments()
  const existingIndex = appointments.findIndex((a) => a.id === appointment.id)
  if (existingIndex > -1) {
    appointments[existingIndex] = appointment
  } else {
    appointments.push(appointment)
  }
  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments))
}

export function getAllAppointments(): Appointment[] {
  if (typeof window === "undefined") return []
  const appointments = localStorage.getItem(STORAGE_KEYS.appointments)
  return appointments ? JSON.parse(appointments) : []
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  return getAllAppointments().filter((a) => a.patientId === patientId)
}

export function getAppointmentsByDoctor(doctorId: string): Appointment[] {
  return getAllAppointments().filter((a) => a.doctorId === doctorId)
}

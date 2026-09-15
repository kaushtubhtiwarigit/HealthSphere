import type { Appointment, MedicalRecord, Prescription, User } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

const toDate = (value: unknown) => {
  if (!value) return undefined
  if (value instanceof Date) return value
  const date = new Date(value as any)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const toId = (value: unknown) => {
  if (!value) return undefined
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "object" && value !== null && "toString" in value) {
    try {
      const str = (value as { toString: () => string }).toString()
      return str !== "[object Object]" ? str : undefined
    } catch (error) {
      return undefined
    }
  }
  return undefined
}

const normalizeUser = (item: any): User => {
  const id = toId(item?.id ?? item?._id)
  const normalizedName =
    item?.name || item?.fullName || [item?.firstName || "", item?.lastName || ""].join(" ").trim()

  return {
    ...item,
    id,
    name: normalizedName || item?.email,
    createdAt: toDate(item?.createdAt),
    updatedAt: toDate(item?.updatedAt),
  }
}

const normalizeMedicalRecord = (item: any): MedicalRecord => {
  const id = toId(item?.id ?? item?._id)
  return {
    ...item,
    id,
    date: toDate(item?.date) ?? new Date(),
    createdAt: toDate(item?.createdAt),
    updatedAt: toDate(item?.updatedAt),
  }
}

const normalizeAppointment = (item: any): Appointment => {
  const id = toId(item?.id ?? item?._id)
  return {
    ...item,
    id,
    date: toDate(item?.date) ?? new Date(),
    createdAt: toDate(item?.createdAt),
    updatedAt: toDate(item?.updatedAt),
  }
}

const normalizePrescription = (item: any): Prescription => {
  const id = toId(item?.id ?? item?._id)
  return {
    ...item,
    id,
    issuedDate: toDate(item?.issuedDate) ?? new Date(),
    expiryDate: toDate(item?.expiryDate) ?? new Date(),
    createdAt: toDate(item?.createdAt),
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || "Request failed")
  return data
}

export async function fetchPatients(query = ""): Promise<User[]> {
  const data = await http<{ success: boolean; items: User[] }>(`/api/users?role=patient&q=${encodeURIComponent(query)}`)
  return data.items.map(normalizeUser)
}

export async function fetchDoctors(query = ""): Promise<User[]> {
  const data = await http<{ success: boolean; items: User[] }>(`/api/users?role=doctor&q=${encodeURIComponent(query)}`)
  return data.items.map(normalizeUser)
}

export async function fetchUsers(params: { role?: string; query?: string } = {}): Promise<User[]> {
  const searchParams = new URLSearchParams()
  if (params.role) searchParams.set("role", params.role)
  if (params.query) searchParams.set("q", params.query)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const data = await http<{ success: boolean; items: User[] }>(`/api/users${suffix}`)
  return data.items.map(normalizeUser)
}

export async function fetchMedicalRecordsByPatient(patientId: string) {
  const data = await http<{ success: boolean; items: MedicalRecord[] }>(
    `/api/medical-records?patientId=${encodeURIComponent(patientId)}`,
  )
  return data.items.map(normalizeMedicalRecord)
}

export async function fetchMedicalRecordsByDoctor(doctorId: string) {
  const data = await http<{ success: boolean; items: MedicalRecord[] }>(
    `/api/medical-records?doctorId=${encodeURIComponent(doctorId)}`,
  )
  return data.items.map(normalizeMedicalRecord)
}

export async function createMedicalRecord(payload: Partial<MedicalRecord>) {
  const data = await http<{ success: boolean; item: MedicalRecord }>(`/api/medical-records`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return normalizeMedicalRecord(data.item)
}

export async function createPrescription(payload: Partial<Prescription>) {
  const data = await http<{ success: boolean; item: Prescription }>(`/api/prescriptions`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return normalizePrescription(data.item)
}

export async function fetchPrescriptionsByPatient(patientId: string) {
  const data = await http<{ success: boolean; items: Prescription[] }>(
    `/api/prescriptions?patientId=${encodeURIComponent(patientId)}`,
  )
  return data.items.map(normalizePrescription)
}

export async function fetchPrescriptionsByDoctor(doctorId: string) {
  const data = await http<{ success: boolean; items: Prescription[] }>(
    `/api/prescriptions?doctorId=${encodeURIComponent(doctorId)}`,
  )
  return data.items.map(normalizePrescription)
}

export async function fetchAppointmentsByPatient(patientId: string) {
  const data = await http<{ success: boolean; items: Appointment[] }>(
    `/api/appointments?patientId=${encodeURIComponent(patientId)}`,
  )
  return data.items.map(normalizeAppointment)
}

export async function fetchAppointmentsByDoctor(doctorId: string) {
  const data = await http<{ success: boolean; items: Appointment[] }>(
    `/api/appointments?doctorId=${encodeURIComponent(doctorId)}`,
  )
  return data.items.map(normalizeAppointment)
}

export async function fetchAppointments(params: { patientId?: string; doctorId?: string } = {}) {
  const searchParams = new URLSearchParams()
  if (params.patientId) searchParams.set("patientId", params.patientId)
  if (params.doctorId) searchParams.set("doctorId", params.doctorId)
  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const data = await http<{ success: boolean; items: Appointment[] }>(`/api/appointments${suffix}`)
  return data.items.map(normalizeAppointment)
}

export async function createAppointment(payload: Partial<Appointment>) {
  const data = await http<{ success: boolean; item: Appointment }>(`/api/appointments`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return normalizeAppointment(data.item)
}

export async function updateAppointment(id: string, payload: Partial<Appointment>) {
  const data = await http<{ success: boolean; item: Appointment }>(`/api/appointments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return normalizeAppointment(data.item)
}

export async function deleteUser(id: string) {
  return http<{ success: boolean }>(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export async function updateUser(id: string, payload: Partial<User>) {
  const data = await http<{ success: boolean; item: User }>(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return normalizeUser(data.item)
}

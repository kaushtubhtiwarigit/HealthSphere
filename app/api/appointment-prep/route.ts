import { NextResponse, type NextRequest } from "next/server"
import { generatePrepPackWithAI } from "@/lib/appointment-prep-utils"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"
import type { Appointment, MedicalRecord, Prescription } from "@/lib/types"

export const runtime = "nodejs"

/**
 * POST /api/appointment-prep
 * Request body: {
 *   appointmentId: string
 *   patientId: string
 * }
 * Response: {
 *   success: true,
 *   data: AppointmentPrepPack
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const appointmentId: string = body?.appointmentId || ""
    const patientId: string = body?.patientId || ""

    if (!appointmentId || !patientId) {
      return NextResponse.json(
        { success: false, message: "appointmentId and patientId are required." },
        { status: 400 }
      )
    }

    // Fetch appointment
    const appointmentsCol = await getCollection("appointments")
    let appointment: any = null

    try {
      appointment = await appointmentsCol.findOne({ _id: new ObjectId(appointmentId) })
    } catch {
      appointment = await appointmentsCol.findOne({ id: appointmentId })
    }

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found." },
        { status: 404 }
      )
    }

    // Fetch patient profile
    const usersCol = await getCollection("users")
    let patient: any = null

    try {
      patient = await usersCol.findOne({ _id: new ObjectId(patientId) })
    } catch {
      patient = await usersCol.findOne({ id: patientId })
    }

    // Fetch medical records and prescriptions
    const recordsCol = await getCollection("medical_records")
    const prescriptionsCol = await getCollection("prescriptions")

    const [medicalRecords, prescriptions] = await Promise.all([
      recordsCol.find({ patientId }).sort({ date: -1 }).limit(10).toArray(),
      prescriptionsCol.find({ patientId }).sort({ issuedDate: -1 }).limit(10).toArray(),
    ])

    const patientProfile = {
      allergies: patient?.allergies || [],
      medicalHistory: patient?.medicalHistory || [],
    }

    // Generate prep pack with AI enhancement
    const prepPack = await generatePrepPackWithAI(
      appointment as Appointment,
      medicalRecords as unknown as MedicalRecord[],
      prescriptions as unknown as Prescription[],
      patientProfile
    )

    return NextResponse.json({
      success: true,
      data: prepPack,
    })
  } catch (error) {
    console.error("[appointment-prep] error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    )
  }
}

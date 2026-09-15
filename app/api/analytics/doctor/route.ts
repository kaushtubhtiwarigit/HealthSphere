import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  calculatePatientStats,
  calculateDemographics,
  calculateAppointmentAnalytics,
  calculateMedicalInsights,
  calculatePerformanceMetrics,
  calculateTrends,
} from "@/lib/analytics-utils"

export const runtime = "nodejs"

/**
 * GET /api/analytics/doctor?doctorId=xxx
 * Fetch comprehensive analytics for a doctor
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")

    if (!doctorId) {
      logger.warn("Analytics request missing doctorId")
      return NextResponse.json(
        { success: false, message: "doctorId is required" },
        { status: 400 }
      )
    }

    logger.info(`Fetching analytics for doctor: ${doctorId}`)

    // Get collections
    const users = await getCollection("users")
    const appointments = await getCollection("appointments")
    const records = await getCollection("medical_records")
    const prescriptions = await getCollection("prescriptions")

    // Fetch all relevant data for the doctor
    const [
      allPatients,
      doctorAppointments,
      doctorRecords,
      doctorPrescriptions,
    ] = await Promise.all([
      users.find({ role: "patient" }).toArray(),
      appointments.find({ doctorId }).toArray(),
      records.find({ doctorId }).toArray(),
      prescriptions.find({ doctorId }).toArray(),
    ])

    logger.dbOperation("find", "appointments", { doctorId, count: doctorAppointments.length })
    logger.dbOperation("find", "medical_records", { doctorId, count: doctorRecords.length })
    logger.dbOperation("find", "prescriptions", { doctorId, count: doctorPrescriptions.length })

    // Get unique patients from doctor's appointments
    const patientIds = new Set(doctorAppointments.map((apt: any) => apt.patientId))
    const doctorPatients = allPatients.filter((p: any) => 
      patientIds.has(p._id?.toString()) || patientIds.has(p.id)
    )

    // Normalize data for analytics functions
    const normalizedAppointments = doctorAppointments.map((apt: any) => ({
      ...apt,
      id: apt._id?.toString() || apt.id,
      date: new Date(apt.date),
      createdAt: apt.createdAt ? new Date(apt.createdAt) : undefined,
      updatedAt: apt.updatedAt ? new Date(apt.updatedAt) : undefined,
    }))

    const normalizedRecords = doctorRecords.map((rec: any) => ({
      ...rec,
      id: rec._id?.toString() || rec.id,
      date: new Date(rec.date),
      symptoms: rec.symptoms || [],
    }))

    const normalizedPrescriptions = doctorPrescriptions.map((rx: any) => ({
      ...rx,
      id: rx._id?.toString() || rx.id,
      issuedDate: new Date(rx.issuedDate),
      expiryDate: new Date(rx.expiryDate),
      medications: rx.medications || [],
    }))

    const normalizedPatients = doctorPatients.map((p: any) => ({
      ...p,
      id: p._id?.toString() || p.id,
    }))

    // Calculate analytics
    const patientStats = calculatePatientStats(
      normalizedPatients,
      normalizedRecords,
      normalizedAppointments
    )

    const demographics = calculateDemographics(normalizedPatients)

    const appointmentAnalytics = calculateAppointmentAnalytics(normalizedAppointments)

    const medicalInsights = calculateMedicalInsights(
      normalizedRecords,
      normalizedPrescriptions
    )

    const performanceMetrics = calculatePerformanceMetrics(
      normalizedAppointments,
      normalizedRecords,
      normalizedPrescriptions
    )

    // Calculate previous month data for trends (simplified)
    const now = new Date()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const lastMonthAppointments = normalizedAppointments.filter(
      (apt: any) =>
        new Date(apt.date) >= lastMonthStart &&
        new Date(apt.date) <= lastMonthEnd &&
        apt.status === "completed"
    )

    const trends = calculateTrends(
      {
        appointments: appointmentAnalytics.completed,
        patients: patientStats.monthly,
        records: medicalInsights.totalRecords,
      },
      {
        appointments: lastMonthAppointments.length,
        patients: patientStats.monthly, // Simplified
        records: medicalInsights.totalRecords, // Simplified
      }
    )

    const analyticsData = {
      patientStats,
      demographics,
      appointmentAnalytics,
      medicalInsights,
      performanceMetrics,
      trends,
      metadata: {
        doctorId,
        generatedAt: new Date().toISOString(),
        dataRange: {
          from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          to: now.toISOString(),
        },
        totalDataPoints: {
          patients: normalizedPatients.length,
          appointments: normalizedAppointments.length,
          records: normalizedRecords.length,
          prescriptions: normalizedPrescriptions.length,
        },
      },
    }

    const duration = Date.now() - startTime
    logger.info(`Analytics calculated successfully in ${duration}ms`)

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error) {
    logger.error("Failed to fetch analytics", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 }
    )
  }
}

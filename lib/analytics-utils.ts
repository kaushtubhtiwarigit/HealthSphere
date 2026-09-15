/**
 * Analytics Utilities
 * Helper functions for calculating statistics, trends, and aggregations
 */

import type { Appointment, MedicalRecord, Prescription, User } from "./types"

/**
 * Calculate time-based statistics for patients
 */
export function calculatePatientStats(
  patients: User[],
  records: MedicalRecord[],
  appointments: Appointment[]
) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get unique patients from appointments
  const patientsSeenToday = new Set(
    appointments
      .filter((apt) => new Date(apt.date) >= todayStart && apt.status === "completed")
      .map((apt) => apt.patientId)
  )

  const patientsSeenWeek = new Set(
    appointments
      .filter((apt) => new Date(apt.date) >= weekStart && apt.status === "completed")
      .map((apt) => apt.patientId)
  )

  const patientsSeenMonth = new Set(
    appointments
      .filter((apt) => new Date(apt.date) >= monthStart && apt.status === "completed")
      .map((apt) => apt.patientId)
  )

  // Calculate new vs returning patients based on first appointment
  const patientFirstAppointment = new Map<string, Date>()
  appointments
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((apt) => {
      if (!patientFirstAppointment.has(apt.patientId)) {
        patientFirstAppointment.set(apt.patientId, new Date(apt.date))
      }
    })

  const newPatientsMonth = Array.from(patientFirstAppointment.entries()).filter(
    ([_, firstDate]) => firstDate >= monthStart
  ).length

  const returningPatientsMonth = patientsSeenMonth.size - newPatientsMonth

  return {
    daily: patientsSeenToday.size,
    weekly: patientsSeenWeek.size,
    monthly: patientsSeenMonth.size,
    newPatientsMonth,
    returningPatientsMonth,
    totalPatients: patients.length,
  }
}

/**
 * Calculate demographic breakdown
 */
export function calculateDemographics(patients: User[]) {
  const genderBreakdown = patients.reduce(
    (acc, p) => {
      const gender = (p as any).gender || "Unknown"
      acc[gender] = (acc[gender] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate age groups from dateOfBirth
  const ageGroups = { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "65+": 0, Unknown: 0 }
  
  patients.forEach((p) => {
    const dob = (p as any).dateOfBirth
    if (!dob) {
      ageGroups.Unknown++
      return
    }

    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    
    if (age <= 18) ageGroups["0-18"]++
    else if (age <= 35) ageGroups["19-35"]++
    else if (age <= 50) ageGroups["36-50"]++
    else if (age <= 65) ageGroups["51-65"]++
    else ageGroups["65+"]++
  })

  return {
    gender: genderBreakdown,
    ageGroups,
  }
}

/**
 * Calculate appointment analytics
 */
export function calculateAppointmentAnalytics(appointments: Appointment[]) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const appointmentsThisMonth = appointments.filter((apt) => new Date(apt.date) >= monthStart)

  // No-show rate
  const scheduled = appointmentsThisMonth.filter((apt) => apt.status === "scheduled").length
  const completed = appointmentsThisMonth.filter((apt) => apt.status === "completed").length
  const cancelled = appointmentsThisMonth.filter((apt) => apt.status === "cancelled").length
  const total = appointmentsThisMonth.length

  const completionRate = total > 0 ? (completed / total) * 100 : 0
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0
  const noShowRate = total > 0 ? ((total - completed - cancelled) / total) * 100 : 0

  // Peak hours/days
  const hourCounts = new Array(24).fill(0)
  const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  appointmentsThisMonth.forEach((apt) => {
    const date = new Date(apt.date)
    const hour = date.getHours()
    const day = dayNames[date.getDay()]
    
    hourCounts[hour]++
    dayCounts[day as keyof typeof dayCounts]++
  })

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
  const peakDay = Object.entries(dayCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

  // Cancellation reasons
  const cancellationReasons: Record<string, number> = {}
  appointmentsThisMonth
    .filter((apt) => apt.status === "cancelled" && (apt as any).cancellationReason)
    .forEach((apt) => {
      const reason = (apt as any).cancellationReason || "No reason provided"
      cancellationReasons[reason] = (cancellationReasons[reason] || 0) + 1
    })

  // Average duration (mock - would need actual duration tracking)
  const averageDuration = 30 // minutes

  return {
    total,
    scheduled,
    completed,
    cancelled,
    completionRate: Math.round(completionRate * 10) / 10,
    cancellationRate: Math.round(cancellationRate * 10) / 10,
    noShowRate: Math.round(noShowRate * 10) / 10,
    averageDuration,
    peakHour: `${peakHour}:00`,
    peakDay,
    hourlyDistribution: hourCounts,
    dailyDistribution: dayCounts,
    cancellationReasons,
  }
}

/**
 * Calculate medical insights
 */
export function calculateMedicalInsights(records: MedicalRecord[], prescriptions: Prescription[]) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Most common diagnoses
  const diagnosisCounts: Record<string, number> = {}
  records.forEach((record) => {
    const diagnosis = record.diagnosis
    diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1
  })

  const topDiagnoses = Object.entries(diagnosisCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([diagnosis, count]) => ({ diagnosis, count }))

  // Most prescribed medications
  const medicationCounts: Record<string, number> = {}
  prescriptions.forEach((rx) => {
    rx.medications.forEach((med) => {
      medicationCounts[med.name] = (medicationCounts[med.name] || 0) + 1
    })
  })

  const topMedications = Object.entries(medicationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([medication, count]) => ({ medication, count }))

  // Most common symptoms
  const symptomCounts: Record<string, number> = {}
  records.forEach((record) => {
    record.symptoms.forEach((symptom) => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
    })
  })

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, count]) => ({ symptom, count }))

  // Seasonal trends (last 6 months)
  const monthlyDiagnoses = new Map<string, Record<string, number>>()
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    monthlyDiagnoses.set(monthKey, {})
  }

  records.forEach((record) => {
    const recordDate = new Date(record.date)
    const monthKey = recordDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    
    if (monthlyDiagnoses.has(monthKey)) {
      const monthData = monthlyDiagnoses.get(monthKey)!
      monthData[record.diagnosis] = (monthData[record.diagnosis] || 0) + 1
    }
  })

  const seasonalTrends = Array.from(monthlyDiagnoses.entries()).map(([month, diagnoses]) => ({
    month,
    totalDiagnoses: Object.values(diagnoses).reduce((sum, count) => sum + count, 0),
    topDiagnosis: Object.entries(diagnoses).sort((a, b) => b[1] - a[1])[0]?.[0] || "None",
  }))

  return {
    topDiagnoses,
    topMedications,
    topSymptoms,
    seasonalTrends,
    totalRecords: records.length,
    totalPrescriptions: prescriptions.length,
  }
}

/**
 * Calculate performance metrics
 */
export function calculatePerformanceMetrics(
  appointments: Appointment[],
  records: MedicalRecord[],
  prescriptions: Prescription[]
) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const appointmentsThisMonth = appointments.filter(
    (apt) => new Date(apt.date) >= monthStart && apt.status === "completed"
  )
  const recordsThisMonth = records.filter((rec) => new Date(rec.date) >= monthStart)
  const prescriptionsThisMonth = prescriptions.filter((rx) => new Date(rx.issuedDate) >= monthStart)

  // Consultation efficiency (appointments per day)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const consultationsPerDay = appointmentsThisMonth.length / daysInMonth

  // Record creation rate
  const recordsPerAppointment =
    appointmentsThisMonth.length > 0 ? recordsThisMonth.length / appointmentsThisMonth.length : 0

  // Prescription rate
  const prescriptionsPerAppointment =
    appointmentsThisMonth.length > 0 ? prescriptionsThisMonth.length / appointmentsThisMonth.length : 0

  // Response time (mock - would need actual message tracking)
  const averageResponseTime = "< 2 hours"

  // Patient satisfaction (mock - would need actual survey data)
  const patientSatisfaction = 4.5 // out of 5

  return {
    consultationsPerDay: Math.round(consultationsPerDay * 10) / 10,
    recordsPerAppointment: Math.round(recordsPerAppointment * 100) / 100,
    prescriptionsPerAppointment: Math.round(prescriptionsPerAppointment * 100) / 100,
    averageResponseTime,
    patientSatisfaction,
    totalAppointmentsMonth: appointmentsThisMonth.length,
    totalRecordsMonth: recordsThisMonth.length,
    totalPrescriptionsMonth: prescriptionsThisMonth.length,
  }
}

/**
 * Generate comparison with previous period
 */
export function calculateTrends(
  currentMonthData: any,
  previousMonthData: any
): Record<string, { value: number; trend: "up" | "down" | "stable"; percentage: number }> {
  const trends: Record<string, any> = {}

  Object.keys(currentMonthData).forEach((key) => {
    const current = currentMonthData[key]
    const previous = previousMonthData[key]

    if (typeof current === "number" && typeof previous === "number") {
      const change = current - previous
      const percentage = previous > 0 ? Math.abs((change / previous) * 100) : 0

      trends[key] = {
        value: current,
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        percentage: Math.round(percentage * 10) / 10,
      }
    }
  })

  return trends
}

/**
 * Export data for CSV/PDF reports
 */
export function prepareAnalyticsExport(analyticsData: any) {
  return {
    generatedAt: new Date().toISOString(),
    period: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      end: new Date().toISOString(),
    },
    data: analyticsData,
  }
}

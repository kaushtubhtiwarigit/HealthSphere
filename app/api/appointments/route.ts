import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || undefined
    const doctorId = searchParams.get("doctorId") || undefined
    
    logger.apiRequest('GET', '/api/appointments', { patientId: !!patientId, doctorId: !!doctorId })

    const filter: Record<string, any> = {}
    if (patientId) filter.patientId = patientId
    if (doctorId) filter.doctorId = doctorId

    logger.dbOperation('find', 'appointments', filter)
    const appointmentsCol = await getCollection("appointments")
    const items = await appointmentsCol.find(filter).sort({ date: -1 }).toArray()
    
    logger.apiResponse('GET', '/api/appointments', 200, { count: items.length })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    logger.error('Failed to fetch appointments', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, doctorId, date, time, status, reason, notes } = body
    
    logger.apiRequest('POST', '/api/appointments', { patientId, doctorId })
    
    if (!patientId || !doctorId || !date || !time) {
      logger.warn('Appointment creation missing required fields')
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const appointmentsCol = await getCollection("appointments")
    const doc = {
      patientId,
      doctorId,
      date: new Date(date),
      time,
      status: status || "scheduled",
      reason: reason || null,
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    logger.dbOperation('insertOne', 'appointments', { patientId, doctorId })
    const result = await appointmentsCol.insertOne(doc)
    
    logger.info('Appointment created', { appointmentId: result.insertedId.toString() })
    logger.apiResponse('POST', '/api/appointments', 200, { appointmentId: result.insertedId.toString() })
    
    return NextResponse.json({ success: true, item: { _id: result.insertedId, ...doc } })
  } catch (error) {
    logger.error('Failed to create appointment', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}



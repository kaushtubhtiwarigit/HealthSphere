import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || undefined
    const doctorId = searchParams.get("doctorId") || undefined
    
    logger.apiRequest('GET', '/api/medical-records', { patientId: !!patientId, doctorId: !!doctorId })

    const filter: Record<string, any> = {}
    if (patientId) filter.patientId = patientId
    if (doctorId) filter.doctorId = doctorId

    logger.dbOperation('find', 'medical_records', filter)
    const recordsCol = await getCollection("medical_records")
    const items = await recordsCol.find(filter).sort({ date: -1 }).toArray()
    
    logger.apiResponse('GET', '/api/medical-records', 200, { count: items.length })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    logger.error('Failed to fetch medical records', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, doctorId, date, diagnosis, symptoms, notes, attachments } = body
    
    logger.apiRequest('POST', '/api/medical-records', { patientId, doctorId, diagnosis })
    
    if (!patientId || !doctorId || !diagnosis) {
      logger.warn('Medical record creation missing required fields')
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const recordsCol = await getCollection("medical_records")
    const doc = {
      patientId,
      doctorId,
      date: date ? new Date(date) : new Date(),
      diagnosis,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      notes: notes || null,
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    logger.dbOperation('insertOne', 'medical_records', { patientId, doctorId })
    const result = await recordsCol.insertOne(doc)
    
    logger.info('Medical record created', { recordId: result.insertedId.toString(), diagnosis })
    logger.apiResponse('POST', '/api/medical-records', 200, { recordId: result.insertedId.toString() })
    
    return NextResponse.json({ success: true, item: { _id: result.insertedId, ...doc } })
  } catch (error) {
    logger.error('Failed to create medical record', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}



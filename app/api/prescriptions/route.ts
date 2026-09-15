import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || undefined
    const doctorId = searchParams.get("doctorId") || undefined
    const recordId = searchParams.get("recordId") || undefined
    
    logger.apiRequest('GET', '/api/prescriptions', { patientId: !!patientId, doctorId: !!doctorId, recordId: !!recordId })

    const filter: Record<string, any> = {}
    if (patientId) filter.patientId = patientId
    if (doctorId) filter.doctorId = doctorId
    if (recordId) filter.recordId = recordId

    logger.dbOperation('find', 'prescriptions', filter)
    const col = await getCollection("prescriptions")
    const items = await col.find(filter).sort({ issuedDate: -1 }).toArray()
    
    logger.apiResponse('GET', '/api/prescriptions', 200, { count: items.length })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    logger.error('Failed to fetch prescriptions', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recordId, patientId, doctorId, medications, notes, issuedDate, expiryDate } = body
    
    logger.apiRequest('POST', '/api/prescriptions', { recordId, patientId, doctorId })
    
    if (!recordId || !patientId || !doctorId || !Array.isArray(medications)) {
      logger.warn('Prescription creation missing required fields')
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const col = await getCollection("prescriptions")
    const doc = {
      recordId,
      patientId,
      doctorId,
      medications,
      notes: notes || null,
      issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    }

    logger.dbOperation('insertOne', 'prescriptions', { recordId, patientId })
    const result = await col.insertOne(doc)
    
    logger.info('Prescription created', { prescriptionId: result.insertedId.toString(), medicationCount: medications.length })
    logger.apiResponse('POST', '/api/prescriptions', 200, { prescriptionId: result.insertedId.toString() })
    
    return NextResponse.json({ success: true, item: { _id: result.insertedId, ...doc } })
  } catch (error) {
    logger.error('Failed to create prescription', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}



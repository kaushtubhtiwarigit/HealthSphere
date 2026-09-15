import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    logger.apiRequest('PATCH', `/api/appointments/${id}`)
    
    if (!id) {
      logger.warn('Appointment update missing id')
      return NextResponse.json({ success: false, message: "Appointment id is required" }, { status: 400 })
    }

    const payload = await request.json()
    const updates: Record<string, any> = { updatedAt: new Date() }
    if (payload.status) {
      updates.status = payload.status
      // Track cancellation metadata
      if (payload.status === "cancelled") {
        updates.cancelledAt = new Date()
        if (payload.cancellationReason) {
          updates.cancellationReason = payload.cancellationReason
        }
        logger.info('Appointment cancelled', { appointmentId: id, reason: payload.cancellationReason })
      }
    }
    if (payload.date) updates.date = new Date(payload.date)
    if (payload.time) updates.time = payload.time
    if (payload.notes !== undefined) updates.notes = payload.notes
    if (payload.reason !== undefined) updates.reason = payload.reason

    const appointments = await getCollection("appointments")
    const objectId = new ObjectId(id)

    logger.dbOperation('findOneAndUpdate', 'appointments', { id })
    const result = await appointments.findOneAndUpdate({ _id: objectId }, { $set: updates }, { returnDocument: "after" })
    
    if (!result || !result.value) {
      logger.warn('Appointment not found for update', { appointmentId: id })
      return NextResponse.json({ success: false, message: "Appointment not found" }, { status: 404 })
    }

    logger.apiResponse('PATCH', `/api/appointments/${id}`, 200)
    return NextResponse.json({ success: true, item: result.value })
  } catch (error) {
    logger.error('Failed to update appointment', error, { appointmentId: params.id })
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}


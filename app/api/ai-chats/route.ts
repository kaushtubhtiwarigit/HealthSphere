import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"

export const runtime = "nodejs"

// GET /api/ai-chats?patientId=...&doctorId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId") || ""
    const doctorId = searchParams.get("doctorId") || ""
    if (!patientId || !doctorId) {
      return NextResponse.json({ success: false, message: "patientId and doctorId are required" }, { status: 400 })
    }

    const chats = await getCollection("ai_chats")
    const doc = await chats.findOne({ patientId, doctorId })
    return NextResponse.json({ success: true, item: doc || null })
  } catch (error) {
    console.error("[API] /api/ai-chats GET error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

// POST /api/ai-chats  { patientId, doctorId, messages }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { patientId, doctorId, messages } = body || {}
    if (!patientId || !doctorId || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: "patientId, doctorId, messages[] required" }, { status: 400 })
    }

    const chats = await getCollection("ai_chats")
    const now = new Date()
    const update = {
      $set: { patientId, doctorId, messages, updatedAt: now },
      $setOnInsert: { createdAt: now },
    }
    const result = await chats.findOneAndUpdate({ patientId, doctorId }, update, {
      upsert: true,
      returnDocument: "after",
    })
    const item: any = (result as any)?.value || (await chats.findOne({ patientId, doctorId }))
    return NextResponse.json({ success: true, item })
  } catch (error) {
    
    console.error("[API] /api/ai-chats POST error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

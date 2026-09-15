import { NextResponse, type NextRequest } from "next/server"
import { generatePlainLanguageSummary } from "@/lib/ai-utils"

export const runtime = "nodejs"

/**
 * POST /api/ai-record-summary
 * Request body: { diagnosis: string; symptoms?: string[]; notes?: string }
 * Response: { success: true, data: { title, summary, disclaimer } }
 *
 * Guardrails:
 * - Returns clear disclaimer that this is NOT medical advice
 * - Redacts overly long notes and avoids definitive statements
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const diagnosis: string = (body?.diagnosis ?? "").toString()
    const symptoms: string[] = Array.isArray(body?.symptoms) ? body.symptoms.filter(Boolean) : []
    const notes: string = (body?.notes ?? "").toString()

    if (!diagnosis && !notes && symptoms.length === 0) {
      return NextResponse.json(
        { success: false, message: "Provide at least diagnosis, symptoms, or notes to summarize." },
        { status: 400 },
      )
    }

    const data = await generatePlainLanguageSummary(diagnosis, symptoms, notes)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("/api/ai-record-summary error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

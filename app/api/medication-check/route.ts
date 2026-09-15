import { NextResponse, type NextRequest } from "next/server"
import { analyzeMedications, analyzeWithAI } from "@/lib/medication-utils"
import type { Medication } from "@/lib/types"

export const runtime = "nodejs"

/**
 * POST /api/medication-check
 * Request body: {
 *   medications: Medication[]
 *   patientAllergies?: string[]
 *   useAI?: boolean
 * }
 * Response: {
 *   success: true,
 *   data: MedicationCheckResult,
 *   aiAnalysis?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const medications: Medication[] = Array.isArray(body?.medications) ? body.medications : []
    const patientAllergies: string[] = Array.isArray(body?.patientAllergies) ? body.patientAllergies : []
    const useAI: boolean = body?.useAI === true

    if (medications.length === 0) {
      return NextResponse.json(
        { success: false, message: "No medications provided for analysis." },
        { status: 400 }
      )
    }

    // Always run rule-based analysis
    const result = analyzeMedications(medications)

    // Optionally enhance with AI analysis
    let aiAnalysis: string | undefined

    if (useAI) {
      try {
        aiAnalysis = await analyzeWithAI(medications, patientAllergies)
      } catch (error) {
        console.error("[medication-check] AI analysis failed:", error)
        // Continue without AI analysis
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      aiAnalysis,
    })
  } catch (error) {
    console.error("[medication-check] error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    )
  }
}

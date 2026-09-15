import { NextResponse, type NextRequest } from "next/server"
import { checkDrugInteractions } from "@/lib/ai-clinical-tools"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/drug-interactions
 * Check for drug-drug interactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medications, patientContext } = body

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { success: false, message: "Medications array is required" },
        { status: 400 }
      )
    }

    logger.info("[Drug Interaction] Checking interactions", {
      medicationCount: medications.length,
      hasContext: !!patientContext,
    })

    const result = await checkDrugInteractions(medications, patientContext)

    logger.info("[Drug Interaction] Check complete", {
      hasInteractions: result.hasInteractions,
      interactionCount: result.interactions?.length || 0,
      riskLevel: result.overallRisk,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Drug Interaction] Error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to check drug interactions",
      },
      { status: 500 }
    )
  }
}

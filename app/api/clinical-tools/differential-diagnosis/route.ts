import { NextResponse, type NextRequest } from "next/server"
import { generateDifferentialDiagnosis } from "@/lib/ai-clinical-tools"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/differential-diagnosis
 * Generate differential diagnoses based on symptoms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symptoms, patientContext } = body

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { success: false, message: "Symptoms array is required" },
        { status: 400 }
      )
    }

    logger.info("[Differential Diagnosis] Analyzing symptoms", { 
      symptomCount: symptoms.length,
      hasContext: !!patientContext 
    })

    const result = await generateDifferentialDiagnosis(symptoms, patientContext)

    logger.info("[Differential Diagnosis] Analysis complete", {
      diagnosesCount: result.differentialDiagnoses?.length || 0,
      urgency: result.urgencyLevel,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Differential Diagnosis] Error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate differential diagnosis",
      },
      { status: 500 }
    )
  }
}

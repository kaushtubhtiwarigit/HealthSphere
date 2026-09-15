import { NextResponse, type NextRequest } from "next/server"
import { calculateDosage } from "@/lib/ai-clinical-tools"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/calculate-dosage
 * Calculate medication dosage based on patient factors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medication, patientFactors } = body

    if (!medication || typeof medication !== "string") {
      return NextResponse.json(
        { success: false, message: "Medication name is required" },
        { status: 400 }
      )
    }

    if (!patientFactors || !patientFactors.age || !patientFactors.weight || !patientFactors.indication) {
      return NextResponse.json(
        { success: false, message: "Patient factors (age, weight, indication) are required" },
        { status: 400 }
      )
    }

    logger.info("[Dosage Calculator] Calculating dosage", {
      medication,
      age: patientFactors.age,
      weight: patientFactors.weight,
    })

    const result = await calculateDosage(medication, patientFactors)

    logger.info("[Dosage Calculator] Calculation complete")

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Dosage Calculator] Error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to calculate dosage",
      },
      { status: 500 }
    )
  }
}

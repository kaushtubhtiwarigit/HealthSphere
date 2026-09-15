import { NextResponse, type NextRequest } from "next/server"
import { calculateDosage } from "@/lib/ai-clinical-tools"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { medication, patientFactors } = body || {}

    if (!medication || !patientFactors) {
      return NextResponse.json(
        { success: false, message: "Medication and patientFactors are required" },
        { status: 400 }
      )
    }

    if (!patientFactors.age || !patientFactors.weight || !patientFactors.indication) {
      return NextResponse.json(
        { success: false, message: "Patient factors must include age, weight, and indication" },
        { status: 400 }
      )
    }

    const result = await calculateDosage(medication, patientFactors)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[API] /api/clinical-tools/dosage-calculator error", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Server error" 
      },
      { status: 500 }
    )
  }
}

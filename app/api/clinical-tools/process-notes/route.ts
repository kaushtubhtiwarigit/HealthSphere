import { NextResponse, type NextRequest } from "next/server"
import { processClinicalNotes } from "@/lib/ai-clinical-tools"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/process-notes
 * Process voice transcription and extract medical entities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcribedText } = body

    if (!transcribedText || typeof transcribedText !== "string") {
      return NextResponse.json(
        { success: false, message: "Transcribed text is required" },
        { status: 400 }
      )
    }

    logger.info("[Clinical Notes] Processing notes", {
      textLength: transcribedText.length,
    })

    const result = await processClinicalNotes(transcribedText)

    logger.info("[Clinical Notes] Processing complete", {
      symptomsCount: result.extractedEntities?.symptoms?.length || 0,
      diagnosesCount: result.extractedEntities?.diagnoses?.length || 0,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Clinical Notes] Error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to process clinical notes",
      },
      { status: 500 }
    )
  }
}

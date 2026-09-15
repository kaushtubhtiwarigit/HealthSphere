import { NextResponse, type NextRequest } from "next/server"
import { analyzeMedicalImage } from "@/lib/ai-clinical-tools"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/image-analysis
 * Analyze medical images with AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64, imageType, clinicalContext, patientId, recordId } = body

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { success: false, message: "Image data (base64) is required" },
        { status: 400 }
      )
    }

    if (!imageType || !["xray", "ct", "mri", "ultrasound", "other"].includes(imageType)) {
      return NextResponse.json(
        { success: false, message: "Valid imageType is required" },
        { status: 400 }
      )
    }

    logger.info("[Image Analysis] Analyzing image", {
      imageType,
      hasContext: !!clinicalContext,
      patientId,
    })

    const result = await analyzeMedicalImage(imageBase64, imageType, clinicalContext)

    // Store analysis result in database
    if (patientId && recordId) {
      const imageAnalyses = await getCollection("image_analyses")
      
      await imageAnalyses.insertOne({
        patientId,
        recordId,
        imageType,
        clinicalContext,
        analysisResult: result,
        analyzedAt: new Date(),
        createdAt: new Date(),
      })

      logger.dbOperation("insertOne", "image_analyses", { patientId, recordId })
    }

    logger.info("[Image Analysis] Analysis complete", {
      findingsCount: result.findings?.length || 0,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Image Analysis] Error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze medical image",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/clinical-tools/image-analysis?patientId=xxx
 * Get previous image analyses for a patient
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json(
        { success: false, message: "patientId is required" },
        { status: 400 }
      )
    }

    const imageAnalyses = await getCollection("image_analyses")
    const analyses = await imageAnalyses
      .find({ patientId })
      .sort({ analyzedAt: -1 })
      .limit(20)
      .toArray()

    logger.dbOperation("find", "image_analyses", { patientId, count: analyses.length })

    return NextResponse.json({
      success: true,
      analyses: analyses.map((a) => ({
        ...a,
        id: a._id?.toString(),
      })),
    })
  } catch (error) {
    logger.error("[Image Analysis] Get analyses error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch image analyses",
      },
      { status: 500 }
    )
  }
}

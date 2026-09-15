import { NextResponse, type NextRequest } from "next/server"
import { searchMedicalLiterature } from "@/lib/ai-clinical-tools"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/clinical-tools/literature-search
 * Search medical literature and guidelines
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, type = "research" } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, message: "Search query is required" },
        { status: 400 }
      )
    }

    if (!["research", "guidelines", "trials"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Type must be 'research', 'guidelines', or 'trials'" },
        { status: 400 }
      )
    }

    logger.info("[Literature Search] Searching", { query, type })

    const result = await searchMedicalLiterature(query, type)

    logger.info("[Literature Search] Search complete", {
      resultsCount: result.results?.length || 0,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error("[Literature Search] Error", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to search medical literature",
      },
      { status: 500 }
    )
  }
}

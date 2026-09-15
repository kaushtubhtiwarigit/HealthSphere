import { NextRequest, NextResponse } from "next/server"
// import { getServerSession } from "next-auth"
import { getCollection } from "@/lib/db"
import { toObjectId } from "@/lib/objectid"
import { sendToGeminiMedicalFile } from "@/lib/ai-utils"
import { uploadBuffer } from "@/lib/cloudinary"
import type { MedicalFileInfo } from "@/lib/types"

export const runtime = "nodejs" // Set to nodejs for Next.js Node runtime compatibility

export async function POST(req: NextRequest) {
  // Authenticate user (optional: require patient role)
  // const session = await getServerSession()
  // if (!session?.user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()

  const file = formData.get("file") as File | null
  const patientId = formData.get("patientId") as string | null
  const category = (formData.get("category") as string | null) || "other"
  if (!file || !patientId) {
    return NextResponse.json({ success: false, message: "Missing file or patientId" }, { status: 400 })
  }
  const patientObjectId = toObjectId(patientId)
  if (!patientObjectId) {
    return NextResponse.json({ success: false, message: "Invalid patientId" }, { status: 400 })
  }


  console.log("[medical-files] Processing file:", {
    fileName: (file as any).name,
    fileType: (file as any).type,
    fileSize: (file as any).size,
    category,
    patientId: patientObjectId.toString(),
  })

  // Attempt Cloudinary upload first (if configured)
  let cloudinaryMeta: Partial<MedicalFileInfo> = {}
  try {
    if (process.env.CLOUDINARY_URL) {
      const buffer = Buffer.from(await (file as any).arrayBuffer())
      const uploadRes = await uploadBuffer(buffer, { folder: "medical-files" })
      cloudinaryMeta = {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        thumbnailUrl: (uploadRes as any).thumbnailUrl,
        mimeType: uploadRes.resource_type === "image" ? (file as any).type : uploadRes.resource_type,
        bytes: uploadRes.bytes,
        format: uploadRes.format,
        width: uploadRes.width,
        height: uploadRes.height,
        originalFileName: (file as any).name,
        category: category as any,
      }
      console.log("[medical-files] Cloudinary upload success:", {
        publicId: uploadRes.public_id,
        bytes: uploadRes.bytes,
        format: uploadRes.format,
      })
    } else {
      console.warn("[medical-files] CLOUDINARY_URL not configured; skipping cloud upload")
    }
  } catch (err) {
    console.error("[medical-files] Cloudinary upload failed; continuing without cloud metadata", err)
  }

  // 1. Send file to Gemini for extraction
  const geminiResult = await sendToGeminiMedicalFile(file)
  console.log("[medical-files] Gemini extraction result:", { 
    summary: geminiResult.summary,
    detailsKeys: Object.keys(geminiResult.details || {}),
    detailsSample: JSON.stringify(geminiResult.details).substring(0, 200)
  })

  // 2. Build the saved item
  const savedItem: MedicalFileInfo = {
    summary: geminiResult.summary,
    details: geminiResult.details,
    uploadedAt: new Date(),
    // Spread cloud metadata if present
    ...cloudinaryMeta,
  }
  console.log("[medical-files] Item to save:", JSON.stringify(savedItem, null, 2))

  // 3. Save to MongoDB under patient's medicalFilesInformation
  const users = await getCollection("users")
  // @ts-ignore: ignore type error for $push operator
  const updateResult = await users.updateOne(
    { _id: patientObjectId },
    { $push: { medicalFilesInformation: savedItem } } as any
  )

  console.log("[medical-files] MongoDB update result:", {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    patientId: patientObjectId.toString(),
  })

  if (updateResult.matchedCount === 0) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  }

  // 4. Verify the save by fetching the updated user
  const updatedUser = await users.findOne({ _id: patientObjectId })
  const savedCount = updatedUser?.medicalFilesInformation?.length || 0
  console.log("[medical-files] Verification - User now has", savedCount, "medical files")

  // 5. Return the saved item so frontend can update immediately
  return NextResponse.json({ success: true, data: geminiResult, savedItem })
}

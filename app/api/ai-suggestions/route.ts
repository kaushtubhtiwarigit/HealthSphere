import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"

import { getCollection } from "@/lib/db"
import { generateAIPrescriptionSuggestions, generateMedicalAnalysis, generateChatResponse } from "@/lib/ai-utils"

export const runtime = "nodejs"

type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

function pick<T extends object>(obj: T | null | undefined, keys: (keyof T)[]) {
  const out: Partial<T> = {}
  if (!obj) return out
  for (const k of keys) (out as any)[k] = (obj as any)[k]
  return out
}

async function buildPatientContext(patientId: string) {
  // Load patient profile
  const users = await getCollection("users")
  const recordsCol = await getCollection("medical_records")
  const rxCol = await getCollection("prescriptions")

  let patient: any = null
  try {
    const oid = new ObjectId(patientId)
    patient = await users.findOne({ _id: oid })
  } catch {
    // fallback in case id is not ObjectId (unlikely in this app)
    patient = await users.findOne({ id: patientId })
  }

  const [records, prescriptions] = await Promise.all([
    recordsCol.find({ patientId }).sort({ date: -1 }).limit(10).toArray(),
    rxCol.find({ patientId }).sort({ issuedDate: -1 }).limit(10).toArray(),
  ])

  const profile = pick(patient, [
    "name",
    "email",
    "gender",
    "dateOfBirth",
    "bloodGroup",
    "allergies",
    "medicalHistory",
  ] as any)

  const context = {
    profile,
    medicalFilesInformation: Array.isArray(patient?.medicalFilesInformation)
      ? patient.medicalFilesInformation.slice(-5)
      : [],
    recentRecords: records.map((r: any) => pick(r, ["date", "diagnosis", "symptoms", "notes"] as any)),
    recentPrescriptions: prescriptions.map((p: any) => pick(p, [
      "issuedDate",
      "medications",
      "notes",
    ] as any)),
  }

  return { patient, context }
}

function composePrompt(context: any, condition: string, diagnosis?: string, symptoms?: string[], notes?: string) {
  const lines: string[] = []
  lines.push("You are a clinical decision support assistant."
    + " Provide evidence-informed suggestions, typical dosages, and cautions."
    + " Always include safety notes and advise verification with clinical guidelines.")
  lines.push("")
  lines.push("Patient summary:")
  lines.push(`- Name: ${context?.profile?.name || "(hidden)"}`)
  if (context?.profile?.gender) lines.push(`- Gender: ${context.profile.gender}`)
  if (context?.profile?.dateOfBirth) lines.push(`- DOB: ${new Date(context.profile.dateOfBirth).toLocaleDateString()}`)
  if (context?.profile?.bloodGroup) lines.push(`- Blood group: ${context.profile.bloodGroup}`)
  if (Array.isArray(context?.profile?.allergies) && context.profile.allergies.length)
    lines.push(`- Allergies: ${context.profile.allergies.join(", ")}`)
  if (Array.isArray(context?.profile?.medicalHistory) && context.profile.medicalHistory.length)
    lines.push(`- Medical history: ${context.profile.medicalHistory.join(", ")}`)

  if (Array.isArray(context?.recentRecords) && context.recentRecords.length) {
    lines.push("")
    lines.push("Recent records (latest first):")
    for (const r of context.recentRecords.slice(0, 5)) {
      lines.push(`• ${new Date(r.date).toLocaleDateString()}: ${r.diagnosis} — symptoms: ${(r.symptoms||[]).join(", ")}`)
      if (r.notes) lines.push(`  notes: ${r.notes}`)
    }
  }

  if (Array.isArray(context?.recentPrescriptions) && context.recentPrescriptions.length) {
    lines.push("")
    lines.push("Recent prescriptions:")
    for (const p of context.recentPrescriptions.slice(0, 5)) {
      const meds = Array.isArray(p.medications) ? p.medications.map((m: any) => m.name).join(", ") : "(n/a)"
      lines.push(`• ${new Date(p.issuedDate).toLocaleDateString()}: ${meds}`)
    }
  }

  lines.push("")
  lines.push("Current visit:")
  if (diagnosis) lines.push(`- Working diagnosis: ${diagnosis}`)
  if (Array.isArray(symptoms) && symptoms.length) lines.push(`- Symptoms: ${symptoms.join(", ")}`)
  if (condition) lines.push(`- Chief complaint: ${condition}`)
  if (notes) lines.push(`- Notes: ${notes}`)

  lines.push("")
  lines.push("Task: Suggest an initial treatment plan with:")
  lines.push("1) likely causes and differentials")
  lines.push("2) medication options with typical adult dosages and frequency")
  lines.push("3) non-pharmacological advice")
  lines.push("4) monitoring and follow-up")
  lines.push("5) red flags and contraindications")

  return lines.join("\n")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const { patientId, condition = "", diagnosis = "", symptoms = [], notes = "", messages = [] } = body || {}

    if (!patientId) {
      return NextResponse.json({ success: false, message: "patientId is required" }, { status: 400 })
    }

    const { context } = await buildPatientContext(patientId)

    // If chat messages are provided, generate a conversational reply with full patient context
    if (Array.isArray(messages) && messages.length) {
      const lastUser = [...messages].reverse().find((m: ChatMessage) => m.role === "user")
      const userQuestion = lastUser?.content || ""
      
        // Build comprehensive patient context for AI with ALL details
        const patientContextForAI: any = {}
      
        // Patient demographics and personal details
        if (context?.profile?.name) {
          patientContextForAI.name = context.profile.name
        }
        if (context?.profile?.email) {
          patientContextForAI.email = context.profile.email
        }
        if (context?.profile?.dateOfBirth) {
          const age = Math.floor((Date.now() - new Date(context.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          patientContextForAI.age = age
          patientContextForAI.dateOfBirth = new Date(context.profile.dateOfBirth).toLocaleDateString()
        }
        if (context?.profile?.gender) {
          patientContextForAI.gender = context.profile.gender
        }
        if (context?.profile?.bloodGroup) {
          patientContextForAI.bloodGroup = context.profile.bloodGroup
        }
        if (context?.profile?.allergies?.length) {
          patientContextForAI.allergies = context.profile.allergies
        }
        if (context?.profile?.medicalHistory?.length) {
          patientContextForAI.medicalHistory = context.profile.medicalHistory
        }
      
        // Medical files information (AI analyses, lab results, etc.)
        if (context?.medicalFilesInformation?.length) {
          patientContextForAI.medicalFiles = context.medicalFilesInformation.map((file: any) => ({
            uploadDate: file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : "N/A",
            aiSummary: file.aiSummary || "No summary",
            keyFindings: file.keyFindings || []
          }))
        }
      
        // Recent medical records with full details
        if (context?.recentRecords?.length) {
          patientContextForAI.recentRecords = context.recentRecords.map((record: any) => ({
            date: new Date(record.date).toLocaleDateString(),
            diagnosis: record.diagnosis || "N/A",
            symptoms: record.symptoms || [],
            notes: record.notes || "No notes"
          }))
          // Also include most recent diagnosis separately for quick reference
          const latestRecord = context.recentRecords[0]
          patientContextForAI.recentDiagnosis = latestRecord.diagnosis
        }
      
        // Recent prescriptions with full medication details
        if (context?.recentPrescriptions?.length) {
          patientContextForAI.recentPrescriptions = context.recentPrescriptions.map((rx: any) => ({
            issuedDate: new Date(rx.issuedDate).toLocaleDateString(),
            medications: rx.medications?.map((med: any) => ({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration
            })) || [],
            notes: rx.notes || "No notes"
          }))
          // Also include current medications list for quick reference
          const currentMeds = context.recentPrescriptions[0]?.medications?.map((m: any) => 
            `${m.name} (${m.dosage}, ${m.frequency})`
          ) || []
          if (currentMeds.length) {
            patientContextForAI.currentMedications = currentMeds
          }
        }
      
      // Build conversation history (excluding system messages, last 10 exchanges)
      const conversationHistory = messages
        .filter((m: ChatMessage) => m.role !== "system")
        .slice(-10)
      
      // Get AI response using real Gemini API
      const reply = await generateChatResponse(
        userQuestion, 
        patientContextForAI,
        conversationHistory
      )

      const assistant: ChatMessage = { role: "assistant", content: reply }
      return NextResponse.json({ success: true, message: assistant })
    }

    // Initial suggestions flow
    const prompt = composePrompt(context, condition, diagnosis, symptoms, notes)
    console.log("[AI Suggestions] prompt preview:\n" + prompt.substring(0, 400))

    // Use mock generators to simulate LLM response
    const base = await generateAIPrescriptionSuggestions(diagnosis || condition, Array.isArray(symptoms) ? symptoms : [])
    const analysis = await generateMedicalAnalysis(diagnosis || condition, Array.isArray(symptoms) ? symptoms : [], notes || "")

    const suggestions = `${base}\n\n---\n\nContext-aware considerations based on patient data:\n\n${analysis}`

    return NextResponse.json({ success: true, suggestions })
  } catch (error) {
    console.error("/api/ai-suggestions error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

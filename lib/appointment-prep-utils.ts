import type { Appointment, MedicalRecord, Prescription, AppointmentPrepPack, PrepChecklistItem } from "./types"

/**
 * Generate a unique ID for checklist items
 */
function generateId(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`
}

/**
 * Generate base checklist based on appointment reason (rule-based)
 */
function generateBaseChecklist(reason: string): PrepChecklistItem[] {
  const normalized = reason.toLowerCase()
  const items: PrepChecklistItem[] = []
  let index = 0

  // Universal items
  items.push({
    id: generateId("universal", index++),
    text: "Bring your insurance card and photo ID",
    completed: false,
    category: "documents",
  })

  items.push({
    id: generateId("universal", index++),
    text: "List all current medications (including over-the-counter and supplements)",
    completed: false,
    category: "medications",
  })

  items.push({
    id: generateId("universal", index++),
    text: "Note any changes in symptoms or new concerns since last visit",
    completed: false,
    category: "symptoms",
  })

  // Reason-specific items
  if (normalized.includes("follow") || normalized.includes("check")) {
    items.push({
      id: generateId("followup", index++),
      text: "Bring records from any tests done since last visit",
      completed: false,
      category: "documents",
    })

    items.push({
      id: generateId("followup", index++),
      text: "Track how you've been feeling day-to-day (symptom diary if applicable)",
      completed: false,
      category: "symptoms",
    })
  }

  if (normalized.includes("blood") || normalized.includes("lab") || normalized.includes("test")) {
    items.push({
      id: generateId("lab", index++),
      text: "Fast for 8-12 hours if required (check with office)",
      completed: false,
      category: "lifestyle",
    })

    items.push({
      id: generateId("lab", index++),
      text: "Drink plenty of water before blood draw",
      completed: false,
      category: "lifestyle",
    })
  }

  if (normalized.includes("pain") || normalized.includes("chronic")) {
    items.push({
      id: generateId("pain", index++),
      text: "Rate your pain on a scale of 1-10 and note when it's worst",
      completed: false,
      category: "symptoms",
    })

    items.push({
      id: generateId("pain", index++),
      text: "List what makes the pain better or worse",
      completed: false,
      category: "symptoms",
    })
  }

  if (normalized.includes("surgery") || normalized.includes("procedure")) {
    items.push({
      id: generateId("surgery", index++),
      text: "Arrange for someone to drive you home after the procedure",
      completed: false,
      category: "lifestyle",
    })

    items.push({
      id: generateId("surgery", index++),
      text: "Review pre-procedure instructions (fasting, medication holds)",
      completed: false,
      category: "medications",
    })
  }

  if (normalized.includes("mental") || normalized.includes("anxiety") || normalized.includes("depression")) {
    items.push({
      id: generateId("mental", index++),
      text: "Track your mood patterns over the past 2 weeks",
      completed: false,
      category: "symptoms",
    })

    items.push({
      id: generateId("mental", index++),
      text: "Note any sleep disturbances or appetite changes",
      completed: false,
      category: "symptoms",
    })
  }

  return items
}

/**
 * Generate questions to ask the doctor (rule-based)
 */
function generateBaseQuestions(reason: string, hasRecords: boolean, hasPrescriptions: boolean): string[] {
  const normalized = reason.toLowerCase()
  const questions: string[] = []

  // Universal questions
  questions.push("What are the next steps in my care plan?")
  questions.push("Are there any warning signs I should watch for?")

  if (hasPrescriptions) {
    questions.push("Are my current medications still appropriate?")
    questions.push("Are there any new side effects I should know about?")
  }

  // Reason-specific questions
  if (normalized.includes("new") || normalized.includes("first") || normalized.includes("initial")) {
    questions.push("What tests or evaluations do you recommend?")
    questions.push("What lifestyle changes could help my condition?")
  }

  if (normalized.includes("follow") || normalized.includes("check")) {
    questions.push("How is my condition progressing?")
    questions.push("Do we need to adjust my treatment plan?")
  }

  if (normalized.includes("test") || normalized.includes("result")) {
    questions.push("What do my test results mean?")
    questions.push("Do I need any follow-up tests?")
  }

  if (normalized.includes("pain") || normalized.includes("symptom")) {
    questions.push("What could be causing my symptoms?")
    questions.push("What treatment options are available?")
    questions.push("How long until I should expect improvement?")
  }

  if (normalized.includes("medication") || normalized.includes("prescription")) {
    questions.push("How long will I need to take this medication?")
    questions.push("What should I do if I miss a dose?")
    questions.push("Are there more affordable alternatives?")
  }

  return questions
}

/**
 * Extract things to mention based on medical history
 */
function extractThingsToMention(
  records: MedicalRecord[],
  prescriptions: Prescription[]
): string[] {
  const mentions: string[] = []

  // Recent diagnoses
  if (records.length > 0) {
    const recentRecords = records.slice(0, 3)
    recentRecords.forEach((record) => {
      mentions.push(`Recent diagnosis: ${record.diagnosis} (${new Date(record.date).toLocaleDateString()})`)
    })
  }

  // Active medications
  if (prescriptions.length > 0) {
    mentions.push(`Currently taking ${prescriptions.length} prescription${prescriptions.length > 1 ? "s" : ""}`)
  }

  return mentions
}

/**
 * Determine required documents
 */
function determineDocumentsNeeded(reason: string, hasRecords: boolean): string[] {
  const normalized = reason.toLowerCase()
  const docs: string[] = ["Insurance card", "Photo ID"]

  if (hasRecords) {
    docs.push("Previous medical records (if from another provider)")
  }

  if (normalized.includes("referral") || normalized.includes("specialist")) {
    docs.push("Referral from primary care physician")
  }

  if (normalized.includes("test") || normalized.includes("lab")) {
    docs.push("Previous test results (for comparison)")
  }

  if (normalized.includes("imaging") || normalized.includes("scan") || normalized.includes("x-ray")) {
    docs.push("Previous imaging reports or CDs")
  }

  return docs
}

/**
 * Generate appointment prep pack (rule-based)
 */
export function generatePrepPack(
  appointment: Appointment,
  medicalRecords: MedicalRecord[],
  prescriptions: Prescription[]
): AppointmentPrepPack {
  const reason = appointment.reason || "General consultation"
  const checklist = generateBaseChecklist(reason)
  const questions = generateBaseQuestions(reason, medicalRecords.length > 0, prescriptions.length > 0)
  const thingsToMention = extractThingsToMention(medicalRecords, prescriptions)
  const documentsNeeded = determineDocumentsNeeded(reason, medicalRecords.length > 0)

  const summary = `Prepare for your ${reason} appointment on ${new Date(appointment.date).toLocaleDateString()}. Complete the checklist below and review suggested questions.`

  return {
    appointmentId: appointment.id || "",
    appointmentReason: reason,
    appointmentDate: appointment.date,
    checklist,
    questionsToAsk: questions,
    thingsToMention,
    documentsNeeded,
    summary,
  }
}

/**
 * AI-enhanced prep pack generation (uses Gemini if configured)
 */
export async function generatePrepPackWithAI(
  appointment: Appointment,
  medicalRecords: MedicalRecord[],
  prescriptions: Prescription[],
  patientProfile: { allergies?: string[]; medicalHistory?: string[] }
): Promise<AppointmentPrepPack> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GENERATIVE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY

  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-09-2025"

  // Fallback to rule-based if no API key
  if (!apiKey) {
    console.warn("[appointment-prep-utils] No API key configured, using rule-based prep pack")
    return generatePrepPack(appointment, medicalRecords, prescriptions)
  }

  const reason = appointment.reason || "General consultation"
  const recentRecords = medicalRecords.slice(0, 5).map((r) => ({
    date: new Date(r.date).toLocaleDateString(),
    diagnosis: r.diagnosis,
    symptoms: r.symptoms.join(", "),
  }))

  const currentMeds = prescriptions.map((p) => p.medications.map((m) => m.name).join(", ")).join("; ")

  const prompt = `You are a patient care coordinator. Generate a personalized appointment preparation pack.

**Appointment Details:**
- Reason: ${reason}
- Date: ${new Date(appointment.date).toLocaleDateString()}

**Patient Context:**
- Recent diagnoses: ${recentRecords.map((r) => `${r.diagnosis} (${r.date})`).join(", ") || "None"}
- Current medications: ${currentMeds || "None"}
- Known allergies: ${patientProfile.allergies?.join(", ") || "None"}
- Medical history: ${patientProfile.medicalHistory?.join(", ") || "None"}

Generate a JSON response with these fields:
{
  "checklist": [{"text": "...", "category": "documents|symptoms|questions|lifestyle|medications"}],
  "questionsToAsk": ["question 1", "question 2", ...],
  "thingsToMention": ["important point 1", ...],
  "documentsNeeded": ["document 1", ...],
  "summary": "Brief overview for the patient"
}

Make it specific, actionable, and helpful. Focus on what the patient needs to know and do. Include 5-7 checklist items, 4-6 questions, and relevant documents.

Return ONLY valid JSON.`

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text || ""

    // Parse JSON response
    let parsed: any = null
    try {
      parsed = JSON.parse(text)
    } catch {
      const first = text.indexOf("{")
      const last = text.lastIndexOf("}")
      if (first !== -1 && last !== -1) {
        parsed = JSON.parse(text.slice(first, last + 1))
      }
    }

    if (parsed && typeof parsed === "object") {
      // Convert AI response to our type structure
      const checklist: PrepChecklistItem[] = (parsed.checklist || []).map((item: any, index: number) => ({
        id: generateId("ai", index),
        text: item.text || item,
        completed: false,
        category: item.category || "questions",
      }))

      return {
        appointmentId: appointment.id || "",
        appointmentReason: reason,
        appointmentDate: appointment.date,
        checklist,
        questionsToAsk: parsed.questionsToAsk || [],
        thingsToMention: parsed.thingsToMention || [],
        documentsNeeded: parsed.documentsNeeded || [],
        summary: parsed.summary || `Preparation guide for your ${reason} appointment.`,
      }
    }

    // Fallback if parsing fails
    throw new Error("Invalid JSON response from AI")
  } catch (error) {
    console.error("[appointment-prep-utils] AI generation failed:", error)
    // Fall back to rule-based generation
    return generatePrepPack(appointment, medicalRecords, prescriptions)
  }
}

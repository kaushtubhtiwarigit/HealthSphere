
// Send a medical file to Gemini (or a configured AI endpoint) and extract information.
// IMPORTANT: Do NOT hardcode API keys in source. Set the following environment variables in your
// server environment (e.g. in .env.local) and restart the Next.js server:
//
// GEMINI_API_URL=https://your-generative-api.example.com/v1/extract
// GEMINI_API_KEY=ya29.... (keep secret, do NOT commit)
//
// When both variables are present the function will attempt to POST the file to GEMINI_API_URL
// with an Authorization: Bearer header. If they are not present, a mocked response is returned
// (useful for local dev without credentials).
export async function sendToGeminiMedicalFile(file: File): Promise<{ summary: string; details: any }> {
  // Prefer GEMINI_API_KEY (server secret) but accept GOOGLE_API_KEY or GENERATIVE_API_KEY too.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENERATIVE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  // API URL may be explicitly provided, otherwise we'll use the Google Generative Language endpoint for Gemini Vision.
  let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  // If user mistakenly set the API key into GEMINI_API_URL (common), detect and clear it.
  if (apiUrl && apiUrl.startsWith("AIza")) {
    console.warn("It looks like GEMINI_API_URL contains an API key. Please set GEMINI_API_URL to the full endpoint URL or leave it empty to use the default model endpoint.")
    apiUrl = ""
  }

  if (!apiKey) {
    console.warn("GEMINI API key not configured; returning mocked extraction result")
    await new Promise((resolve) => setTimeout(resolve, 400))
    const mockResult = {
      summary: "Extracted summary from uploaded file (mocked)",
      details: { type: (file as any)?.type, name: (file as any)?.name, size: (file as any)?.size },
    }
    console.log("[ai-utils] Returning mock result:", mockResult)
    return mockResult
  }

  // Use the official generateContent model endpoint if apiUrl not provided
  if (!apiUrl) {
    // NOTE: update model name as needed for your account/preview access
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${encodeURIComponent(apiKey)}`
  } else if (!apiUrl.includes("key=")) {
    // If apiUrl provided but no key param, append apiKey as query param (API key auth)
    const sep = apiUrl.includes("?") ? "&" : "?"
    apiUrl = `${apiUrl}${sep}key=${encodeURIComponent(apiKey)}`
  }

  // Build prompt
  const prompt = `You are an assistant that extracts important structured information from an uploaded medical test image or PDF (lab report, scan, test results, prescription).\n\n` +
    `Return a single JSON object with  fields that seem important for medical purposes \n` +
    `Return ONLY valid JSON and nothing else. If you cannot extract values, keep fields null and include a \"raw_text\" field with key findings.`

  // Convert file to base64 (Node-compatible)
  let base64 = ""
  try {
    const buffer = Buffer.from(await (file as any).arrayBuffer())
    base64 = buffer.toString("base64")
  } catch (e) {
    console.error("failed to read file for Gemini Vision:", e)
    return { summary: "(error) could not read file", details: { error: String(e) } }
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: (file as any)?.type || "application/octet-stream", data: base64 } },
        ],
      },
    ],
  }

  // Backoff helper
  async function fetchWithBackoff(url: string, options: any, retries = 4, delay = 800): Promise<Response> {
    try {
      const res = await fetch(url, options)
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        const err = new Error(`HTTP ${res.status} ${res.statusText} - ${body}`)
        ;(err as any).status = res.status
        throw err
      }
      return res
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delay))
        return fetchWithBackoff(url, options, retries - 1, delay * 2)
      }
      throw err
    }
  }

  try {
    const res = await fetchWithBackoff(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    console.log("[ai-utils] Gemini API raw response:", JSON.stringify(json).substring(0, 500))

    // Example response structure: { candidates: [ { content: { parts: [ { text: '...' } ] } } ] }
    const candidate = json?.candidates?.[0]
    const text = candidate?.content?.parts?.[0]?.text || candidate?.content?.parts?.find((p: any) => p.text)?.text || JSON.stringify(json)
    console.log("[ai-utils] Extracted text from response:", text.substring(0, 300))

    // Try to parse JSON from the returned text
    let parsed: any = null
    try {
      parsed = JSON.parse(text)
      console.log("[ai-utils] Successfully parsed JSON:", Object.keys(parsed))
    } catch (err) {
      console.log("[ai-utils] Text is not valid JSON, trying to extract JSON substring")
      const first = text.indexOf("{")
      const last = text.lastIndexOf("}")
      if (first !== -1 && last !== -1 && last > first) {
        try {
          parsed = JSON.parse(text.slice(first, last + 1))
          console.log("[ai-utils] Extracted and parsed JSON:", Object.keys(parsed))
        } catch (e) {
          console.log("[ai-utils] Failed to extract JSON from text")
          parsed = null
        }
      }
    }

    if (parsed) {
      const result = { summary: parsed.test_name ? `Extracted ${parsed.test_name}` : "Extracted data", details: parsed }
      console.log("[ai-utils] Returning parsed result:", result.summary)
      return result
    }

    // If not JSON, return the raw candidate text
    const result = { summary: "Extraction result (text)", details: { text } }
    console.log("[ai-utils] Returning text result")
    return result
  } catch (err) {
    console.error("callGeminiVisionAPI error:", err)
    return { summary: "(error) could not extract — see server logs", details: { error: String(err) } }
  }
}
// AI utility functions - simulating Gemini API responses
// In production, this would call the actual Gemini API via Vercel AI Gateway

export async function generateAIPrescriptionSuggestions(diagnosis: string, symptoms: string[]): Promise<string> {
  // Simulate API call with realistic prescription suggestions
  const prescriptionDatabase: { [key: string]: string } = {
    hypertension:
      "Based on the diagnosis of hypertension with symptoms of high blood pressure and headaches:\n\n1. **Primary Medication**: Lisinopril 10mg once daily\n   - An ACE inhibitor that helps lower blood pressure\n   - Take consistently at the same time each day\n\n2. **Complementary**: Amlodipine 5mg once daily\n   - A calcium channel blocker for additional blood pressure control\n\n3. **Lifestyle**: Reduce sodium intake, exercise 30 mins daily, stress management\n\n4. **Follow-up**: Monitor blood pressure weekly, recheck in 4 weeks",

    diabetes:
      "Based on the diagnosis of Type 2 Diabetes with symptoms of increased thirst and fatigue:\n\n1. **Primary Medication**: Metformin 500mg twice daily\n   - First-line treatment for Type 2 Diabetes\n   - Take with meals to reduce side effects\n\n2. **Supplementary**: Gliclazide 80mg once daily\n   - Helps stimulate insulin production\n\n3. **Monitoring**: Check blood glucose levels before meals and at bedtime\n\n4. **Lifestyle**: Regular exercise, balanced diet low in refined sugars\n\n5. **Follow-up**: HbA1c test in 3 months",

    "allergic rhinitis":
      "Based on the diagnosis of Allergic Rhinitis with symptoms of nasal congestion and sneezing:\n\n1. **Antihistamine**: Cetirizine 10mg once daily\n   - Non-drowsy formulation\n   - Best taken in the evening\n\n2. **Nasal Spray**: Fluticasone 2 sprays in each nostril daily\n   - Reduces inflammation and congestion\n\n3. **PRN Relief**: Phenylephrine nasal spray as needed\n   - For acute congestion relief\n\n4. **Preventive**: Avoid allergen triggers, use air filters\n\n5. **Follow-up**: Reassess symptoms in 2 weeks",

    general:
      "Based on the provided symptoms, here are general recommendations:\n\n1. **Primary Assessment**: Further clinical evaluation may be needed\n\n2. **Symptomatic Relief**: Consider over-the-counter options based on specific symptoms\n\n3. **Monitoring**: Track symptom progression over 1-2 weeks\n\n4. **Follow-up**: Recommend follow-up appointment if symptoms persist\n\n5. **Lifestyle**: Adequate rest, hydration, and nutrition are important",
  }

  // Find matching prescription or use general
  const key = diagnosis.toLowerCase()
  let suggestion = prescriptionDatabase["general"]

  for (const [dbKey, dbValue] of Object.entries(prescriptionDatabase)) {
    if (key.includes(dbKey)) {
      suggestion = dbValue
      break
    }
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return suggestion
}

export async function generateMedicalAnalysis(diagnosis: string, symptoms: string[], notes: string): Promise<string> {
  // Simulate AI analysis - handle both structured analysis and conversational chat
  
  // Check if this is a chat query (indicated by "chat" diagnosis or natural language question in notes)
  if (diagnosis === "chat" || notes.toLowerCase().includes("question:") || notes.toLowerCase().includes("doctor's question:")) {
    // Extract the actual question
    const questionMatch = notes.match(/question:\s*"?([^"]+)"?/i)
    const question = questionMatch ? questionMatch[1].trim().toLowerCase() : notes.toLowerCase()
    
    // Conversational responses based on question type
    if (question.includes("diet") || question.includes("food") || question.includes("eat")) {
      return "For Type 2 Diabetes, diet is crucial:\n\n**Focus on:**\n- Whole grains, vegetables, lean proteins\n- Complex carbs with low glycemic index\n- Avoid refined sugars and processed foods\n- Portion control is key\n\n**Practical tips:**\n- Eat at regular times\n- Include fiber in each meal\n- Monitor carb intake (45-60g per meal)\n- Stay hydrated with water, not sugary drinks"
    }
    
    if (question.includes("exercise") || question.includes("activity") || question.includes("physical")) {
      return "Exercise is excellent for diabetes management:\n\n- **Aim for:** 150 minutes moderate activity per week (30 min × 5 days)\n- **Best types:** Walking, swimming, cycling\n- **Timing:** After meals helps control blood sugar spikes\n- **Monitor:** Check blood sugar before/after if on insulin\n- **Start slow:** If sedentary, begin with 10-minute walks\n\n⚠️ Advise checking blood sugar before exercise if on medications that can cause hypoglycemia."
    }
    
    if (question.includes("alternative") || question.includes("instead") || question.includes("different medication")) {
      return "Alternative options to Metformin:\n\n**If GI side effects:**\n- Metformin XR (extended-release) - better tolerated\n- Start with lower dose and increase gradually\n\n**Other first-line options:**\n- SGLT2 inhibitors (empagliflozin) - also protect heart/kidneys\n- GLP-1 agonists (semaglutide) - good for weight loss\n\n**Important:** Check patient's renal function and cardiovascular status before switching. Patient is allergic to Penicillin and Sulfa drugs - avoid if relevant."
    }
    
    if (question.includes("side effect") || question.includes("adverse")) {
      return "Common side effects to watch for:\n\n**Metformin:**\n- GI upset (30% of patients): nausea, diarrhea - usually improves in 1-2 weeks\n- Take with food to minimize\n- Rarely: lactic acidosis (if renal impairment)\n\n**Gliclazide:**\n- Hypoglycemia (monitor blood sugar)\n- Weight gain (mild)\n- GI upset\n\n**When to adjust:** If side effects persist beyond 2 weeks or are severe."
    }
    
    if (question.includes("yes") || question.includes("no") || question.includes("should i") || question.includes("can i")) {
      return "Yes, that's appropriate for this patient. The current treatment plan aligns with standard guidelines for Type 2 Diabetes. Just ensure regular monitoring of HbA1c and renal function."
    }
    
    // Generic conversational response
    return "Based on this patient's profile (Type 2 Diabetes, on Metformin/Gliclazide), that's a good consideration. The key is:\n\n- Monitor blood glucose regularly\n- Watch for interactions with current medications\n- Consider patient's age and comorbidities\n- Ensure patient understands the plan\n\nIf you're considering any medication changes, check renal function first and note the patient's allergies (Penicillin, Sulfa drugs)."
  }
  
  // Structured analysis for initial suggestions (keep existing format)
  const analysis = `
Medical Record Analysis:

**Diagnosis**: ${diagnosis}
**Symptoms**: ${symptoms.join(", ") || "Not specified"}
**Clinical Notes**: ${notes || "None provided"}

**Analysis Summary**:
- Primary condition requires careful monitoring
- Current symptom profile aligns with diagnosis
- Recommended medication adjustments based on latest guidelines
- Patient education on condition management is essential

**Recommendations**:
1. Continue current treatment plan with close follow-up
2. Consider lifestyle modifications to support recovery
3. Monitor vital signs regularly
4. Schedule follow-up appointment in 4 weeks
5. Patient should maintain medication compliance

**Risk Assessment**: Low to Moderate
- Condition is manageable with proper treatment
- Patient education and compliance are key factors
  `

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  return analysis
}

// Generate conversational chat response using Gemini AI
export async function generateChatResponse(
  userQuestion: string,
  patientContext: {
    age?: number
    gender?: string
    allergies?: string[]
    medicalHistory?: string[]
    recentDiagnosis?: string
    currentMedications?: string[]
  },
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENERATIVE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-09-2025"

  // Fallback to mock response if no API key
  if (!apiKey) {
    console.warn("[AI Chat] No Gemini API key configured, using mock response")
    return generateMockChatResponse(userQuestion, patientContext)
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`

    // Build context-aware system prompt
    const systemPrompt = buildChatSystemPrompt(patientContext)
    
    // Build conversation messages
    const contents: any[] = []
    
    // Add system context
    contents.push({
      parts: [{ text: systemPrompt }]
    })
    
    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      // Take last 5 exchanges to avoid token limits
      const recentHistory = conversationHistory.slice(-10)
      recentHistory.forEach(msg => {
        if (msg.role === "user" || msg.role === "assistant") {
          contents.push({
            parts: [{ text: msg.content }]
          })
        }
      })
    }
    
    // Add current question
    contents.push({
      parts: [{ text: userQuestion }]
    })

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[AI Chat] Gemini API error:", response.status, errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text || ""

    if (!text) {
      console.warn("[AI Chat] No text in Gemini response, using fallback")
      return generateMockChatResponse(userQuestion, patientContext)
    }

    return text.trim()
  } catch (error) {
    console.error("[AI Chat] Error calling Gemini API:", error)
    return generateMockChatResponse(userQuestion, patientContext)
  }
}

// Build context-aware system prompt
function buildChatSystemPrompt(patientContext: {
  name?: string
  email?: string
  age?: number
  gender?: string
  dateOfBirth?: string
  bloodGroup?: string
  allergies?: string[]
  medicalHistory?: string[]
  medicalFiles?: Array<{
    uploadDate: string
    aiSummary: string
    keyFindings: string[]
  }>
  recentRecords?: Array<{
    date: string
    diagnosis: string
    symptoms: string[]
    notes: string
  }>
  recentPrescriptions?: Array<{
    issuedDate: string
    medications: Array<{
      name: string
      dosage: string
      frequency: string
      duration: string
    }>
    notes: string
  }>
  recentDiagnosis?: string
  currentMedications?: string[]
}): string {
  const parts: string[] = []
  
  parts.push("You are a medical AI assistant helping a doctor with patient care. Provide evidence-based, concise, and practical clinical guidance.")
  parts.push("")
  parts.push("=== COMPLETE PATIENT CONTEXT ===")
  parts.push("")
  
  // Personal Information
  parts.push("PATIENT IDENTITY:")
  if (patientContext.name) {
    parts.push(`- Name: ${patientContext.name}`)
  }
  if (patientContext.email) {
    parts.push(`- Email: ${patientContext.email}`)
  }
  if (patientContext.dateOfBirth) {
    parts.push(`- Date of Birth: ${patientContext.dateOfBirth}`)
  }
  
  if (patientContext.age) {
    parts.push(`- Age: ${patientContext.age} years old`)
  }
  if (patientContext.gender) {
    parts.push(`- Gender: ${patientContext.gender}`)
  }
  if (patientContext.bloodGroup) {
    parts.push(`- Blood Group: ${patientContext.bloodGroup}`)
  }
  
  parts.push("")
  
  // Critical Information
  if (patientContext.allergies && patientContext.allergies.length > 0) {
    parts.push("⚠️ ALLERGIES (CRITICAL - CHECK BEFORE ANY MEDICATION):")
    patientContext.allergies.forEach(allergy => {
      parts.push(`  • ${allergy}`)
    })
    parts.push("")
  }
  
  if (patientContext.medicalHistory && patientContext.medicalHistory.length > 0) {
    parts.push("MEDICAL HISTORY:")
    patientContext.medicalHistory.forEach(condition => {
      parts.push(`  • ${condition}`)
    })
    parts.push("")
  }
  
  // Medical Files (AI summaries from uploaded documents)
  if (patientContext.medicalFiles && patientContext.medicalFiles.length > 0) {
    parts.push("MEDICAL FILES & LAB REPORTS:")
    patientContext.medicalFiles.forEach((file, idx) => {
      parts.push(`  ${idx + 1}. Uploaded: ${file.uploadDate}`)
      parts.push(`     Summary: ${file.aiSummary}`)
      if (file.keyFindings && file.keyFindings.length > 0) {
        parts.push(`     Key Findings: ${file.keyFindings.join(", ")}`)
      }
    })
    parts.push("")
  }
  
  // Recent Medical Records (visits, diagnoses, symptoms)
  if (patientContext.recentRecords && patientContext.recentRecords.length > 0) {
    parts.push("RECENT MEDICAL RECORDS (Most Recent First):")
    patientContext.recentRecords.forEach((record, idx) => {
      parts.push(`  ${idx + 1}. Date: ${record.date}`)
      parts.push(`     Diagnosis: ${record.diagnosis}`)
      if (record.symptoms && record.symptoms.length > 0) {
        parts.push(`     Symptoms: ${record.symptoms.join(", ")}`)
      }
      if (record.notes && record.notes !== "No notes") {
        parts.push(`     Notes: ${record.notes}`)
      }
    })
    parts.push("")
  }
  
  // Recent Prescriptions (medications with dosages)
  if (patientContext.recentPrescriptions && patientContext.recentPrescriptions.length > 0) {
    parts.push("RECENT PRESCRIPTIONS (Most Recent First):")
    patientContext.recentPrescriptions.forEach((rx, idx) => {
      parts.push(`  ${idx + 1}. Date: ${rx.issuedDate}`)
      if (rx.medications && rx.medications.length > 0) {
        parts.push(`     Medications:`)
        rx.medications.forEach(med => {
          parts.push(`       • ${med.name}`)
          parts.push(`         Dosage: ${med.dosage}`)
          parts.push(`         Frequency: ${med.frequency}`)
          parts.push(`         Duration: ${med.duration}`)
        })
      }
      if (rx.notes && rx.notes !== "No notes") {
        parts.push(`     Notes: ${rx.notes}`)
      }
    })
    parts.push("")
  }
  
  // Quick reference for current status
  if (patientContext.recentDiagnosis) {
    parts.push(`CURRENT PRIMARY DIAGNOSIS: ${patientContext.recentDiagnosis}`)
    parts.push("")
  }
  
  if (patientContext.currentMedications && patientContext.currentMedications.length > 0) {
    parts.push("CURRENT ACTIVE MEDICATIONS:")
    patientContext.currentMedications.forEach(med => {
      parts.push(`  • ${med}`)
    })
    parts.push("")
  }
  
  parts.push("=== END PATIENT CONTEXT ===")
  parts.push("")
  
  parts.push("INSTRUCTIONS:")
  parts.push("- Answer the doctor's question naturally and directly")
  parts.push("- You have access to the patient's full medical history above")
  parts.push("- Reference specific details from the context when relevant (dates, diagnoses, medications)")
  parts.push("- If asked about the patient's name or identity, use the information provided above")
  parts.push("- Be conversational, not formulaic")
  parts.push("- Adapt your answer length to the question complexity")
  parts.push("- Use markdown formatting (bold, lists) for clarity")
  parts.push("- ALWAYS consider patient allergies when suggesting medications")
  parts.push("- For simple questions, give brief focused answers")
  parts.push("- For complex questions, provide detailed explanations")
  parts.push("- Include dosing information when relevant")
  parts.push("- Mention drug interactions if current medications are relevant")
  parts.push("- Keep safety warnings brief unless specifically about critical issues")
  parts.push("- If you're unsure, say so and suggest consulting guidelines")
  parts.push("")
  parts.push("Answer the doctor's question:")
  
  return parts.join("\n")
}

// Mock response fallback
function generateMockChatResponse(userQuestion: string, patientContext: any): string {
  const question = userQuestion.toLowerCase()
  
  // Handle identity questions
  if (question.includes("name") || question.includes("who is") || question.includes("patient") && question.includes("?")) {
    const name = patientContext.name || "Unknown"
    const age = patientContext.age || "Unknown age"
    const gender = patientContext.gender || "Unknown gender"
    const diagnosis = patientContext.recentDiagnosis || "No recent diagnosis"
    
    return `**Patient Identity:**\n\n- **Name:** ${name}\n- **Age:** ${age} years old\n- **Gender:** ${gender}\n- **Blood Group:** ${patientContext.bloodGroup || "Not specified"}\n- **Recent Diagnosis:** ${diagnosis}\n\n${patientContext.allergies?.length > 0 ? `⚠️ **Allergies:** ${patientContext.allergies.join(", ")}` : "No known allergies on record."}`
  }
  
  // Check question type and generate appropriate response
  if (question.includes("diet") || question.includes("food") || question.includes("nutrition")) {
    return `For ${patientContext.name || "this patient"}'s ${patientContext.recentDiagnosis || "condition"}, dietary management is important:\n\n**Key Recommendations:**\n- Balanced meals with whole grains and lean proteins\n- Limit processed foods and refined sugars\n- Stay hydrated (8 glasses water/day)\n- Monitor portion sizes\n\n**For ${patientContext.name || "this"} (${patientContext.age || "adult"} year old):** Adjust portions based on activity level and weight goals.`
  }
  
  if (question.includes("exercise") || question.includes("activity") || question.includes("physical")) {
    return `Exercise recommendations for ${patientContext.name || "this patient"} (${patientContext.recentDiagnosis || "current condition"}):\n\n- **Target:** 150 minutes moderate activity per week\n- **Best options:** Walking, swimming, cycling\n- **Start gradually** if currently sedentary\n- Check blood pressure/glucose before and after if on medications\n\n${patientContext.age && patientContext.age > 60 ? `Given ${patientContext.name ? patientContext.name + "'s" : "the patient's"} age (${patientContext.age}), consider lower impact activities.` : "Encourage regular, consistent exercise."}`
  }
  
  if (question.includes("medication") || question.includes("drug") || question.includes("alternative")) {
    const allergyWarning = patientContext.allergies?.length > 0 
      ? `\n\n⚠️ **Critical Alert:** ${patientContext.name || "This patient"} is allergic to ${patientContext.allergies.join(", ")} - avoid these drug classes.`
      : ""
    
    return `When considering medication options for ${patientContext.name || "this patient"}:\n\n- Review current medications: ${patientContext.currentMedications?.join(", ") || "None listed"}\n- Check for drug interactions\n- Adjust dosing for age (${patientContext.age || "unknown"}) and renal function\n- Consider patient adherence and cost${allergyWarning}`
  }
  
  if (question.includes("side effect") || question.includes("adverse")) {
    return `Common side effects to monitor for ${patientContext.name || "this patient"}:\n\n**Current medications:**\n${patientContext.currentMedications?.map((med: string) => `- ${med}: GI upset, dizziness, monitor as needed`).join("\n") || "- No current medications listed"}\n\n**When to be concerned:**\n- Severe reactions or allergic symptoms\n- Symptoms interfering with daily activities\n- New or worsening symptoms\n\nAdvise ${patientContext.name || "the patient"} to report any concerning symptoms immediately.`
  }
  
  // Generic response
  return `Based on ${patientContext.name ? patientContext.name + "'s" : "the patient's"} profile:\n\n- **Name:** ${patientContext.name || "Not specified"}\n- **Age:** ${patientContext.age || "Adult"} year old ${patientContext.gender || "patient"}\n- **Current diagnosis:** ${patientContext.recentDiagnosis || "Not specified"}\n- **Medications:** ${patientContext.currentMedications?.join(", ") || "None listed"}\n\nFor your specific question about "${userQuestion}", I recommend:\n\n1. Review current treatment plan for ${patientContext.name || "this patient"}\n2. Consider patient-specific factors (age, comorbidities)\n3. Monitor for any adverse effects\n4. Ensure patient understanding and compliance\n\n${patientContext.allergies?.length > 0 ? `⚠️ Remember: ${patientContext.name || "Patient"} is allergic to ${patientContext.allergies.join(", ")}` : ""}`
}

// Generate a plain-language summary for patients with strong guardrails.
// In production, replace this mock with an LLM call and keep the structure and disclaimers.
export async function generatePlainLanguageSummary(
  diagnosis: string,
  symptoms: string[] = [],
  notes: string = ""
): Promise<{ title: string; summary: string; disclaimer: string }> {
  // Prefer server-side secret keys
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GENERATIVE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY

  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-09-2025"
  let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

  // Local safe fallback if no key configured
  const localFallback = async () => {
    const safeDiagnosis = diagnosis?.trim() || "your recent visit"
    const cleanSymptoms = (symptoms || []).filter(Boolean)

    const points: string[] = []
    if (safeDiagnosis) points.push(`Main topic: ${safeDiagnosis}.`)
    if (cleanSymptoms.length) points.push(`What you reported: ${cleanSymptoms.join(", ")}.`)
    if (notes) points.push(`Doctor's notes (key points): ${notes.slice(0, 280)}${notes.length > 280 ? "…" : ""}`)

    const summary = [
      `Here’s a simple explanation of ${safeDiagnosis}:`,
      "",
      "What it means:",
      "- This is a general description based on your record.",
      "- It helps you understand the big picture, not every medical detail.",
      "",
      ...(points.length ? ["From your record:", ...points.map((p) => `- ${p}`), ""] : []),
      "What you can do:",
      "- Follow the plan your clinician provided (medicines, tests, follow-up).",
      "- Note any new or worsening symptoms.",
      "- Prepare questions for your next visit.",
    ].join("\n")

    const disclaimer =
      "This summary may be incomplete or inaccurate. It is not medical advice and does not replace guidance from your clinician. If you feel worse, have severe pain, trouble breathing, chest pain, or any emergency signs, seek urgent medical care."

    await new Promise((r) => setTimeout(r, 200))
    return { title: `In simple terms: ${safeDiagnosis}`, summary, disclaimer }
  }

  if (!apiKey) {
    console.warn("[ai-utils] GEMINI_API_KEY not configured; using local fallback for generatePlainLanguageSummary.")
    return localFallback()
  }

  // Build a guarded prompt that instructs STRICT JSON output
  const redactedNotes = (notes || "").toString().slice(0, 1200)
  const content = {
    diagnosis: diagnosis || "",
    symptoms: (symptoms || []).filter(Boolean).slice(0, 20),
    notes: redactedNotes,
  }

  const system =
    "You are a patient education assistant. Explain medical records in clear, simple language (around a few short paragraphs)." +
    " Be cautious, avoid definitive claims, and include safety notes. Return STRICT JSON with keys: title, summary, disclaimer."

  const userInstruction = `
Generate a plain-language summary for a patient based on this record content.
Write at a 6th–8th grade reading level, use short sentences, and include a brief action-oriented checklist.
Do NOT give medical advice. Include a strong safety disclaimer.

Return ONLY a JSON object with keys: "title", "summary", "disclaimer".
`.
    trim()

  const payload = {
    contents: [
      {
        parts: [
          { text: system },
          { text: userInstruction },
          { text: "Record content (JSON):" },
          { text: JSON.stringify(content) },
        ],
      },
    ],
  }

  // Simple exponential backoff
  async function fetchWithBackoff(url: string, options: any, retries = 3, delay = 600): Promise<Response> {
    try {
      const u = url.includes("?") ? `${url}&key=${encodeURIComponent(apiKey!)}` : `${url}?key=${encodeURIComponent(apiKey!)}`
      const res = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options?.body ?? payload),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        const err: any = new Error(`HTTP ${res.status} ${res.statusText} - ${t}`)
        err.status = res.status
        throw err
      }
      return res
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, delay))
        return fetchWithBackoff(url, options, retries - 1, delay * 2)
      }
      throw e
    }
  }

  try {
    const res = await fetchWithBackoff(apiUrl, { body: payload })
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.find((p: any) => p?.text)?.text || ""

    let parsed: any = null
    try {
      parsed = JSON.parse(text)
    } catch {
      const first = text.indexOf("{")
      const last = text.lastIndexOf("}")
      if (first !== -1 && last !== -1 && last > first) {
        try { parsed = JSON.parse(text.slice(first, last + 1)) } catch {}
      }
    }

    const fallbackDisclaimer =
      "This summary may be incomplete or inaccurate. It is not medical advice and does not replace guidance from your clinician. If you feel worse, have severe pain, trouble breathing, chest pain, or any emergency signs, seek urgent medical care."

    if (parsed && typeof parsed === "object") {
      const title = String(parsed.title || `In simple terms: ${diagnosis || "your recent visit"}`)
      const summary = String(parsed.summary || "This is a general explanation based on your record.")
      const disclaimer = String(parsed.disclaimer || fallbackDisclaimer)
      return { title, summary, disclaimer }
    }

    // If parsing failed, degrade gracefully
    console.warn("[ai-utils] Gemini returned non-JSON content; using local fallback.")
    return localFallback()
  } catch (err) {
    console.error("[ai-utils] generatePlainLanguageSummary error:", err)
    return localFallback()
  }
}

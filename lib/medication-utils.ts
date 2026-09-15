import type { Medication, MedicationInteraction, DuplicateTherapy, MedicationCheckResult } from "./types"

// Known interaction database (simplified - in production, use a comprehensive drug database)
const KNOWN_INTERACTIONS: Record<string, { interactions: string[]; severity: string; description: string }> = {
  warfarin: {
    interactions: ["aspirin", "ibuprofen", "naproxen"],
    severity: "major",
    description: "Increased bleeding risk when combined with NSAIDs or antiplatelet agents",
  },
  lisinopril: {
    interactions: ["spironolactone", "amiloride"],
    severity: "moderate",
    description: "Combination may increase potassium levels (hyperkalemia risk)",
  },
  metformin: {
    interactions: ["alcohol"],
    severity: "moderate",
    description: "Alcohol may increase risk of lactic acidosis",
  },
  simvastatin: {
    interactions: ["clarithromycin", "erythromycin", "gemfibrozil"],
    severity: "major",
    description: "Increased risk of muscle toxicity (rhabdomyolysis)",
  },
  ssri: {
    interactions: ["maoi", "tramadol"],
    severity: "critical",
    description: "Risk of serotonin syndrome - potentially life-threatening",
  },
}

// Therapeutic class groupings for duplicate therapy detection
const THERAPEUTIC_CLASSES: Record<string, string[]> = {
  "ACE Inhibitors": ["lisinopril", "enalapril", "ramipril", "captopril"],
  "Beta Blockers": ["metoprolol", "atenolol", "carvedilol", "propranolol"],
  Statins: ["simvastatin", "atorvastatin", "rosuvastatin", "pravastatin"],
  NSAIDs: ["ibuprofen", "naproxen", "diclofenac", "celecoxib"],
  "Proton Pump Inhibitors": ["omeprazole", "lansoprazole", "pantoprazole", "esomeprazole"],
  SSRIs: ["fluoxetine", "sertraline", "citalopram", "escitalopram"],
}

/**
 * Normalize medication name for comparison
 */
function normalizeMedicationName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
}

/**
 * Check for potential drug-drug interactions
 */
export function detectInteractions(medications: Medication[]): MedicationInteraction[] {
  const interactions: MedicationInteraction[] = []
  const medNames = medications.map((m) => normalizeMedicationName(m.name))

  for (let i = 0; i < medications.length; i++) {
    const med1 = normalizeMedicationName(medications[i].name)
    const med1Name = medications[i].name

    // Check against known interactions
    for (const [drug, data] of Object.entries(KNOWN_INTERACTIONS)) {
      if (med1.includes(drug)) {
        for (const interactingDrug of data.interactions) {
          // Check if any other medication contains this interacting drug
          for (let j = 0; j < medications.length; j++) {
            if (i !== j) {
              const med2 = normalizeMedicationName(medications[j].name)
              const med2Name = medications[j].name

              if (med2.includes(interactingDrug)) {
                interactions.push({
                  id: `interaction-${i}-${j}`,
                  medication1: med1Name,
                  medication2: med2Name,
                  severity: data.severity as any,
                  description: data.description,
                  recommendation: getSeverityRecommendation(data.severity as any),
                })
              }
            }
          }
        }
      }
    }
  }

  return interactions
}

/**
 * Check for duplicate therapy (multiple drugs in same therapeutic class)
 */
export function detectDuplicateTherapy(medications: Medication[]): DuplicateTherapy[] {
  const duplicates: DuplicateTherapy[] = []

  for (const [className, drugs] of Object.entries(THERAPEUTIC_CLASSES)) {
    const matchingMeds: string[] = []

    for (const med of medications) {
      const normalized = normalizeMedicationName(med.name)
      for (const drug of drugs) {
        if (normalized.includes(drug)) {
          matchingMeds.push(med.name)
          break
        }
      }
    }

    if (matchingMeds.length > 1) {
      duplicates.push({
        id: `duplicate-${className.replace(/\s+/g, "-").toLowerCase()}`,
        medications: matchingMeds,
        therapeuticClass: className,
        description: `Multiple medications from the same class (${className}) may be redundant or increase side effects.`,
        recommendation: "Consult your provider to confirm if both medications are necessary.",
      })
    }
  }

  return duplicates
}

/**
 * Get recommendation based on severity
 */
function getSeverityRecommendation(severity: string): string {
  switch (severity) {
    case "critical":
      return "⚠️ URGENT: Contact your provider immediately. Do not take these medications together without explicit approval."
    case "major":
      return "Contact your provider before your next dose. This combination requires close monitoring."
    case "moderate":
      return "Discuss with your provider at your next appointment. May require dosage adjustment or monitoring."
    case "minor":
      return "Mention this to your provider. Usually manageable but worth discussing."
    default:
      return "Consult your provider for guidance."
  }
}

/**
 * Calculate overall risk level
 */
function calculateOverallRisk(interactions: MedicationInteraction[], duplicates: DuplicateTherapy[]): {
  risk: "low" | "moderate" | "high" | "critical"
  contactProvider: boolean
} {
  const hasCritical = interactions.some((i) => i.severity === "critical")
  const hasMajor = interactions.some((i) => i.severity === "major")
  const hasModerate = interactions.some((i) => i.severity === "moderate")

  if (hasCritical) {
    return { risk: "critical", contactProvider: true }
  } else if (hasMajor || duplicates.length > 0) {
    return { risk: "high", contactProvider: true }
  } else if (hasModerate) {
    return { risk: "moderate", contactProvider: true }
  } else if (interactions.length > 0) {
    return { risk: "low", contactProvider: false }
  }

  return { risk: "low", contactProvider: false }
}

/**
 * Generate summary text
 */
function generateSummary(interactions: MedicationInteraction[], duplicates: DuplicateTherapy[]): string {
  if (interactions.length === 0 && duplicates.length === 0) {
    return "No known interactions or duplicate therapies detected. Continue taking medications as prescribed."
  }

  const parts: string[] = []

  if (interactions.length > 0) {
    parts.push(`Found ${interactions.length} potential interaction${interactions.length > 1 ? "s" : ""}.`)
  }

  if (duplicates.length > 0) {
    parts.push(`Found ${duplicates.length} duplicate therapy concern${duplicates.length > 1 ? "s" : ""}.`)
  }

  parts.push("Review details below and contact your provider if needed.")

  return parts.join(" ")
}

/**
 * Main function: analyze all prescriptions for interactions and duplicates
 */
export function analyzeMedications(medications: Medication[]): MedicationCheckResult {
  if (!medications || medications.length === 0) {
    return {
      interactions: [],
      duplicates: [],
      overallRisk: "low",
      contactProvider: false,
      summary: "No medications to analyze.",
    }
  }

  const interactions = detectInteractions(medications)
  const duplicates = detectDuplicateTherapy(medications)
  const { risk, contactProvider } = calculateOverallRisk(interactions, duplicates)
  const summary = generateSummary(interactions, duplicates)

  return {
    interactions,
    duplicates,
    overallRisk: risk,
    contactProvider,
    summary,
  }
}

/**
 * AI-powered enhanced analysis (calls Gemini if configured, otherwise returns basic analysis)
 */
export async function analyzeWithAI(medications: Medication[], patientAllergies: string[] = []): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GENERATIVE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY

  const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-09-2025"

  if (!apiKey) {
    // Local fallback with enhanced analysis
    const basicAnalysis = analyzeMedications(medications)
    const parts: string[] = [
      "Medication Safety Review:",
      "",
      basicAnalysis.summary,
      "",
    ]

    if (basicAnalysis.interactions.length > 0) {
      parts.push("Key Interactions:")
      basicAnalysis.interactions.forEach((i) => {
        parts.push(`• ${i.medication1} + ${i.medication2}: ${i.description}`)
      })
      parts.push("")
    }

    if (basicAnalysis.duplicates.length > 0) {
      parts.push("Duplicate Therapy:")
      basicAnalysis.duplicates.forEach((d) => {
        parts.push(`• ${d.medications.join(", ")}: ${d.description}`)
      })
      parts.push("")
    }

    if (patientAllergies.length > 0) {
      parts.push(`Known Allergies: ${patientAllergies.join(", ")}`)
      parts.push("⚠️ Always verify medications against your allergy list.")
    }

    return parts.join("\n")
  }

  // Call Gemini for enhanced analysis
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

  const prompt = `You are a clinical pharmacology assistant. Analyze these medications for interactions, duplicates, and safety concerns.

Medications:
${medications.map((m) => `- ${m.name} ${m.dosage} ${m.frequency}`).join("\n")}

Patient Allergies: ${patientAllergies.join(", ") || "None reported"}

Provide:
1. Key interactions (if any)
2. Duplicate therapy concerns (if any)
3. Allergy considerations
4. Overall safety assessment
5. Recommendations for the patient

Keep the response clear, actionable, and under 300 words. Focus on what the patient should know and do.`

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  }

  try {
    const url = `${apiUrl}?key=${encodeURIComponent(apiKey)}`
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

    return text || "Unable to generate enhanced analysis."
  } catch (error) {
    console.error("[medication-utils] AI analysis failed:", error)
    // Fall back to basic analysis
    return analyzeWithAI(medications, patientAllergies)
  }
}

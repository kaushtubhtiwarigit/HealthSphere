/**
 * AI-Powered Clinical Tools
 * Gemini AI integration for clinical decision support
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const getGeminiAPI = () => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GENERATIVE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    console.warn("[AI Clinical Tools] No Gemini API key found. Using fallback logic.")
    return null
  }

  return new GoogleGenerativeAI(apiKey)
}

const MODEL_NAME = "gemini-2.5-flash"

/**
 * Differential Diagnosis Assistant
 * Analyzes symptoms and provides differential diagnoses with severity assessment
 */
export async function generateDifferentialDiagnosis(
  symptoms: string[],
  patientContext?: {
    age?: number
    gender?: string
    medicalHistory?: string[]
    allergies?: string[]
    currentMedications?: string[]
  }
) {
  const genAI = getGeminiAPI()

  if (!genAI) {
    // Fallback logic
    return {
      differentialDiagnoses: [
        {
          condition: "Common Cold",
          probability: "High",
          severity: "Mild",
          reasoning: "Based on symptom presentation",
          recommendedTests: ["Physical examination", "Throat culture if needed"],
        },
        {
          condition: "Allergic Rhinitis",
          probability: "Moderate",
          severity: "Mild",
          reasoning: "Seasonal symptoms may indicate allergies",
          recommendedTests: ["Allergy testing", "IgE levels"],
        },
      ],
      urgencyLevel: "Routine",
      redFlags: [],
      recommendedActions: ["Rest", "Hydration", "Over-the-counter medications if needed"],
    }
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = `You are an expert medical AI assistant helping with differential diagnosis.

Patient Context:
${patientContext?.age ? `- Age: ${patientContext.age} years` : ""}
${patientContext?.gender ? `- Gender: ${patientContext.gender}` : ""}
${patientContext?.medicalHistory?.length ? `- Medical History: ${patientContext.medicalHistory.join(", ")}` : ""}
${patientContext?.allergies?.length ? `- Allergies: ${patientContext.allergies.join(", ")}` : ""}
${patientContext?.currentMedications?.length ? `- Current Medications: ${patientContext.currentMedications.join(", ")}` : ""}

Presenting Symptoms:
${symptoms.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Please provide a differential diagnosis analysis in the following JSON format:
{
  "differentialDiagnoses": [
    {
      "condition": "Condition name",
      "probability": "High/Moderate/Low",
      "severity": "Critical/Severe/Moderate/Mild",
      "reasoning": "Clinical reasoning for this diagnosis",
      "recommendedTests": ["List of diagnostic tests"]
    }
  ],
  "urgencyLevel": "Emergency/Urgent/Routine",
  "redFlags": ["List any red flag symptoms that require immediate attention"],
  "recommendedActions": ["Immediate actions to take"]
}

Provide 3-5 most likely differential diagnoses ranked by probability. Focus on common conditions but don't miss critical diagnoses.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("[AI Clinical Tools] Differential diagnosis error:", error)
    throw error
  }
}

/**
 * Drug Interaction Checker
 * Checks for interactions between medications
 */
export async function checkDrugInteractions(
  medications: Array<{ name: string; dosage?: string }>,
  patientContext?: {
    age?: number
    weight?: number
    renalFunction?: string
    hepaticFunction?: string
    allergies?: string[]
  }
) {
  const genAI = getGeminiAPI()

  if (!genAI) {
    // Fallback: Basic interaction database
    const knownInteractions = [
      {
        drugs: ["Warfarin", "Aspirin"],
        severity: "Major",
        description: "Increased bleeding risk",
        recommendation: "Avoid combination. Monitor INR closely if must use together.",
      },
      {
        drugs: ["Lisinopril", "Spironolactone"],
        severity: "Moderate",
        description: "Risk of hyperkalemia",
        recommendation: "Monitor potassium levels regularly.",
      },
    ]

    const medNames = medications.map((m) => m.name.toLowerCase())
    const foundInteractions = knownInteractions.filter((interaction) => {
      const interactionDrugs = interaction.drugs.map((d) => d.toLowerCase())
      return interactionDrugs.every((drug) => medNames.some((med) => med.includes(drug)))
    })

    return {
      hasInteractions: foundInteractions.length > 0,
      interactions: foundInteractions.map((int) => ({
        medications: int.drugs,
        severity: int.severity,
        description: int.description,
        recommendation: int.recommendation,
        alternatives: ["Consult pharmacist for alternatives"],
      })),
      dosageWarnings: [],
      patientSpecificWarnings: patientContext?.allergies?.length
        ? [`Patient has allergies: ${patientContext.allergies.join(", ")}`]
        : [],
      overallRisk: foundInteractions.length > 0 ? "Moderate" : "Low",
    }
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = `You are a clinical pharmacology AI assistant. Analyze these medications for potential drug-drug interactions.

Medications:
${medications.map((m, i) => `${i + 1}. ${m.name}${m.dosage ? ` - ${m.dosage}` : ""}`).join("\n")}

Patient Context:
${patientContext?.age ? `- Age: ${patientContext.age} years` : ""}
${patientContext?.weight ? `- Weight: ${patientContext.weight} kg` : ""}
${patientContext?.renalFunction ? `- Renal Function: ${patientContext.renalFunction}` : ""}
${patientContext?.hepaticFunction ? `- Hepatic Function: ${patientContext.hepaticFunction}` : ""}
${patientContext?.allergies?.length ? `- Allergies: ${patientContext.allergies.join(", ")}` : ""}

Provide a comprehensive drug interaction analysis in JSON format:
{
  "hasInteractions": boolean,
  "interactions": [
    {
      "medications": ["Drug A", "Drug B"],
      "severity": "Critical/Major/Moderate/Minor",
      "description": "Description of the interaction",
      "recommendation": "Clinical recommendation",
      "alternatives": ["Alternative medications"]
    }
  ],
  "dosageWarnings": ["Dosage-related warnings for this patient"],
  "patientSpecificWarnings": ["Age/weight/organ function specific warnings"],
  "overallRisk": "Critical/High/Moderate/Low"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("[AI Clinical Tools] Drug interaction check error:", error)
    throw error
  }
}

/**
 * Medical Literature Search
 * Search for relevant medical literature and guidelines
 */
export async function searchMedicalLiterature(
  query: string,
  type: "research" | "guidelines" | "trials" = "research"
) {
  const genAI = getGeminiAPI()

  if (!genAI) {
    // Fallback: Return sample results
    return {
      results: [
        {
          title: "Clinical Practice Guidelines",
          source: "Medical Guidelines Database",
          summary: "Standard treatment protocols for common conditions",
          relevance: "High",
          url: "https://www.example.com/guidelines",
          year: 2024,
        },
      ],
      searchQuery: query,
      totalResults: 1,
    }
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const typeDescriptions = {
    research: "recent peer-reviewed research papers and systematic reviews",
    guidelines: "clinical practice guidelines and treatment protocols",
    trials: "ongoing and completed clinical trials",
  }

  const prompt = `You are a medical literature search assistant. Find and summarize ${typeDescriptions[type]} related to: "${query}"

Provide results in JSON format:
{
  "results": [
    {
      "title": "Paper/guideline title",
      "source": "Journal or organization",
      "summary": "Key findings or recommendations (2-3 sentences)",
      "relevance": "High/Moderate/Low",
      "year": 2024,
      "keyPoints": ["Main clinical takeaways"]
    }
  ],
  "searchQuery": "${query}",
  "totalResults": 5
}

Focus on evidence-based, high-quality sources. Provide 5 most relevant results.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("[AI Clinical Tools] Literature search error:", error)
    throw error
  }
}

/**
 * Medical Image Analysis
 * Analyze medical images (X-rays, CT scans, etc.)
 */
export async function analyzeMedicalImage(
  imageBase64: string,
  imageType: "xray" | "ct" | "mri" | "ultrasound" | "other",
  clinicalContext?: string
) {
  const genAI = getGeminiAPI()

  if (!genAI) {
    return {
      findings: [
        {
          finding: "Image quality assessment required",
          severity: "Informational",
          location: "N/A",
          confidence: "N/A",
        },
      ],
      impression: "AI analysis not available. Manual review by radiologist recommended.",
      recommendations: ["Consult with radiologist for detailed interpretation"],
      disclaimer:
        "This is an AI-assisted preliminary analysis. Always obtain professional radiological interpretation.",
    }
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
    }
  })

  const prompt = `You are a medical imaging AI assistant. Analyze this ${imageType} image and provide a preliminary assessment.

${clinicalContext ? `Clinical Context: ${clinicalContext}` : ""}

Provide analysis in JSON format:
{
  "findings": [
    {
      "finding": "Description of finding",
      "severity": "Critical/Significant/Mild/Normal",
      "location": "Anatomical location",
      "confidence": "High/Moderate/Low"
    }
  ],
  "impression": "Overall impression and key findings",
  "recommendations": ["Suggested follow-up actions"],
  "disclaimer": "Important: This is an AI-assisted preliminary analysis. Always obtain professional radiological interpretation for diagnostic purposes."
}

Be thorough but indicate confidence levels. Flag any critical findings.`

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg",
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("[AI Clinical Tools] Image analysis error:", error)
    throw error
  }
}

/**
 * Enhanced Clinical Notes with Medical NER
 * Process dictated notes and extract medical entities
 */
export async function processClinicalNotes(transcribedText: string) {
  const genAI = getGeminiAPI()

  if (!genAI) {
    return {
      formattedNotes: transcribedText,
      extractedEntities: {
        symptoms: [],
        diagnoses: [],
        medications: [],
        procedures: [],
        labs: [],
      },
      suggestedDiagnosis: "",
      suggestedActions: [],
    }
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = `You are a medical transcription and NER (Named Entity Recognition) AI. Process this clinical note and extract relevant medical information.

Transcribed Text:
"${transcribedText}"

Provide structured output in JSON format:
{
  "formattedNotes": "Professionally formatted clinical notes",
  "extractedEntities": {
    "symptoms": ["List of symptoms mentioned"],
    "diagnoses": ["Potential diagnoses mentioned"],
    "medications": ["Medications mentioned"],
    "procedures": ["Procedures mentioned"],
    "labs": ["Lab tests mentioned"]
  },
  "suggestedDiagnosis": "Most likely diagnosis based on notes",
  "suggestedActions": ["Recommended follow-up actions"]
}

Format the notes in standard medical documentation style (SOAP format if applicable).`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("[AI Clinical Tools] Clinical notes processing error:", error)
    throw error
  }
}

/**
 * Dosage Calculator
 * Calculate medication dosages based on patient factors
 */
export async function calculateDosage(
  medication: string,
  patientFactors: {
    age: number
    weight: number
    indication: string
    renalFunction?: string
    hepaticFunction?: string
  }
) {
  const genAI = getGeminiAPI()

  if (!genAI) {
    return {
      standardDosage: "Consult drug reference",
      adjustedDosage: "Requires clinical calculation",
      frequency: "As per guidelines",
      warnings: ["Consult current prescribing information"],
      monitoring: ["Regular clinical monitoring required"],
    }
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = `You are a clinical pharmacology AI. Calculate the appropriate dosage for this medication.

Medication: ${medication}
Indication: ${patientFactors.indication}

Patient Factors:
- Age: ${patientFactors.age} years
- Weight: ${patientFactors.weight} kg
${patientFactors.renalFunction ? `- Renal Function: ${patientFactors.renalFunction}` : ""}
${patientFactors.hepaticFunction ? `- Hepatic Function: ${patientFactors.hepaticFunction}` : ""}

Provide dosage calculation in JSON format:
{
  "standardDosage": "Standard adult dosage",
  "adjustedDosage": "Dosage adjusted for this patient",
  "frequency": "Dosing frequency",
  "route": "Route of administration",
  "duration": "Typical treatment duration",
  "warnings": ["Important warnings and contraindications"],
  "monitoring": ["Required monitoring parameters"],
  "disclaimer": "Always verify with current prescribing information and clinical guidelines"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("[AI Clinical Tools] Dosage calculation error:", error)
    throw error
  }
}

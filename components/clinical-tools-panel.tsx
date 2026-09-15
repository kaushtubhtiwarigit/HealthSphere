"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  Pill, 
  BookOpen, 
  Mic, 
  Image as ImageIcon, 
  Calculator,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type {
  DifferentialDiagnosisResult,
  DrugInteractionResult,
  MedicalLiteratureSearch,
  MedicalImageAnalysis,
  ClinicalNotesProcessing,
  DosageCalculation,
} from "@/lib/types"

interface ClinicalToolsPanelProps {
  patientContext?: {
    age?: number
    gender?: string
    weight?: number
    medicalHistory?: string[]
    allergies?: string[]
    currentMedications?: string[]
  }
}

export function ClinicalToolsPanel({ patientContext }: ClinicalToolsPanelProps) {
  const { toast } = useToast()

  // Differential Diagnosis state
  const [symptoms, setSymptoms] = useState("")
  const [ddResult, setDdResult] = useState<DifferentialDiagnosisResult | null>(null)
  const [ddLoading, setDdLoading] = useState(false)

  // Drug Interaction state
  const [medications, setMedications] = useState("")
  const [diResult, setDiResult] = useState<DrugInteractionResult | null>(null)
  const [diLoading, setDiLoading] = useState(false)

  // Literature Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"research" | "guidelines" | "trials">("research")
  const [litResult, setLitResult] = useState<MedicalLiteratureSearch | null>(null)
  const [litLoading, setLitLoading] = useState(false)

  // Dosage Calculator state
  const [dosageMed, setDosageMed] = useState("")
  const [dosageAge, setDosageAge] = useState("")
  const [dosageWeight, setDosageWeight] = useState("")
  const [dosageIndication, setDosageIndication] = useState("")
  const [dosageResult, setDosageResult] = useState<DosageCalculation | null>(null)
  const [dosageLoading, setDosageLoading] = useState(false)

  // Differential Diagnosis
  const handleDifferentialDiagnosis = async () => {
    if (!symptoms.trim()) {
      toast({ title: "Error", description: "Please enter symptoms", variant: "destructive" })
      return
    }

    setDdLoading(true)
    try {
      const response = await fetch("/api/clinical-tools/differential-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
          patientContext,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDdResult(data.data)
        toast({ title: "Analysis Complete", description: "Differential diagnoses generated" })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate diagnosis",
        variant: "destructive",
      })
    } finally {
      setDdLoading(false)
    }
  }

  // Drug Interactions
  const handleDrugInteraction = async () => {
    if (!medications.trim()) {
      toast({ title: "Error", description: "Please enter medications", variant: "destructive" })
      return
    }

    setDiLoading(true)
    try {
      const medList = medications
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
        .map((name) => ({ name }))

      const response = await fetch("/api/clinical-tools/drug-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: medList,
          patientContext,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDiResult(data.data)
        toast({
          title: "Check Complete",
          description: data.data.hasInteractions
            ? `Found ${data.data.interactions.length} interaction(s)`
            : "No interactions found",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check interactions",
        variant: "destructive",
      })
    } finally {
      setDiLoading(false)
    }
  }

  // Literature Search
  const handleLiteratureSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Error", description: "Please enter search query", variant: "destructive" })
      return
    }

    setLitLoading(true)
    try {
      const response = await fetch("/api/clinical-tools/literature-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          type: searchType,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setLitResult(data.data)
        toast({
          title: "Search Complete",
          description: `Found ${data.data.results?.length || 0} results`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search literature",
        variant: "destructive",
      })
    } finally {
      setLitLoading(false)
    }
  }

  // Dosage Calculator
  const handleDosageCalculation = async () => {
    if (!dosageMed || !dosageAge || !dosageWeight || !dosageIndication) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" })
      return
    }

    setDosageLoading(true)
    try {
      const response = await fetch("/api/clinical-tools/calculate-dosage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medication: dosageMed,
          patientFactors: {
            age: parseInt(dosageAge),
            weight: parseFloat(dosageWeight),
            indication: dosageIndication,
          },
        }),
      })

      const data = await response.json()
      if (data.success) {
        setDosageResult(data.data)
        toast({ title: "Calculation Complete", description: "Dosage recommendations generated" })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate dosage",
        variant: "destructive",
      })
    } finally {
      setDosageLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white"
      case "high":
      case "major":
        return "bg-orange-500 text-white"
      case "moderate":
        return "bg-yellow-500 text-black"
      case "low":
      case "minor":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI-Powered Clinical Tools
          </CardTitle>
          <CardDescription>
            Advanced clinical decision support powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="differential" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="differential">Diagnosis</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="literature">Literature</TabsTrigger>
              <TabsTrigger value="dosage">Dosage</TabsTrigger>
            </TabsList>

            {/* Differential Diagnosis */}
            <TabsContent value="differential" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Symptoms (comma-separated)</label>
                    <Input
                      placeholder="e.g., Fever, Cough, Fatigue"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                    <Button onClick={handleDifferentialDiagnosis} disabled={ddLoading} className="w-full">
                      {ddLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Generate Differential Diagnosis"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {ddResult && (
                <div className="space-y-4 mt-4">
                  <Alert variant={ddResult.urgencyLevel === "Emergency" ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Urgency:</strong> {ddResult.urgencyLevel}
                    </AlertDescription>
                  </Alert>

                  {ddResult.redFlags.length > 0 && (
                    <Card className="border-red-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">Red Flags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {ddResult.redFlags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold">Differential Diagnoses:</h4>
                    {ddResult.differentialDiagnoses.map((diagnosis, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{diagnosis.condition}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline">{diagnosis.probability}</Badge>
                              <Badge className={getRiskColor(diagnosis.severity)}>
                                {diagnosis.severity}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>{diagnosis.reasoning}</p>
                          {diagnosis.recommendedTests.length > 0 && (
                            <div>
                              <strong>Recommended Tests:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {diagnosis.recommendedTests.map((test, j) => (
                                  <li key={j}>{test}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {ddResult.recommendedActions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recommended Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {ddResult.recommendedActions.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Drug Interactions */}
            <TabsContent value="interactions" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Medications (comma-separated)</label>
                    <Input
                      placeholder="e.g., Aspirin, Warfarin, Lisinopril"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                    />
                    <Button onClick={handleDrugInteraction} disabled={diLoading} className="w-full">
                      {diLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check Drug Interactions"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {diResult && (
                <div className="space-y-4 mt-4">
                  <Alert variant={diResult.overallRisk === "Critical" || diResult.overallRisk === "High" ? "destructive" : "default"}>
                    <AlertDescription>
                      <strong>Overall Risk:</strong> {diResult.overallRisk}
                    </AlertDescription>
                  </Alert>

                  {diResult.hasInteractions ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Detected Interactions:</h4>
                      {diResult.interactions.map((interaction, i) => (
                        <Card key={i} className="border-orange-500">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-sm">
                                {interaction.medications.join(" + ")}
                              </CardTitle>
                              <Badge className={getRiskColor(interaction.severity)}>
                                {interaction.severity}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p><strong>Description:</strong> {interaction.description}</p>
                            <p><strong>Recommendation:</strong> {interaction.recommendation}</p>
                            {interaction.alternatives.length > 0 && (
                              <div>
                                <strong>Alternatives:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  {interaction.alternatives.map((alt, j) => (
                                    <li key={j}>{alt}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>No significant interactions detected</AlertDescription>
                    </Alert>
                  )}

                  {diResult.dosageWarnings.length > 0 && (
                    <Card className="border-yellow-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Dosage Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {diResult.dosageWarnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {diResult.patientSpecificWarnings.length > 0 && (
                    <Card className="border-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Patient-Specific Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {diResult.patientSpecificWarnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Literature Search */}
            <TabsContent value="literature" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Search Query</label>
                    <Input
                      placeholder="e.g., Treatment for type 2 diabetes"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant={searchType === "research" ? "default" : "outline"}
                        onClick={() => setSearchType("research")}
                        size="sm"
                      >
                        Research
                      </Button>
                      <Button
                        variant={searchType === "guidelines" ? "default" : "outline"}
                        onClick={() => setSearchType("guidelines")}
                        size="sm"
                      >
                        Guidelines
                      </Button>
                      <Button
                        variant={searchType === "trials" ? "default" : "outline"}
                        onClick={() => setSearchType("trials")}
                        size="sm"
                      >
                        Trials
                      </Button>
                    </div>
                    <Button onClick={handleLiteratureSearch} disabled={litLoading} className="w-full">
                      {litLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        "Search Literature"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {litResult && (
                <div className="space-y-3 mt-4">
                  <h4 className="font-semibold">Results ({litResult.totalResults}):</h4>
                  {litResult.results.map((result, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{result.title}</CardTitle>
                          <Badge variant="outline">{result.year}</Badge>
                        </div>
                        <CardDescription>{result.source}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>{result.summary}</p>
                        {result.keyPoints && result.keyPoints.length > 0 && (
                          <div>
                            <strong>Key Points:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {result.keyPoints.map((point, j) => (
                                <li key={j}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Badge className={getRiskColor(result.relevance)}>
                          Relevance: {result.relevance}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Dosage Calculator */}
            <TabsContent value="dosage" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Medication Name</label>
                      <Input
                        placeholder="e.g., Amoxicillin"
                        value={dosageMed}
                        onChange={(e) => setDosageMed(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Age (years)</label>
                        <Input
                          type="number"
                          placeholder="Age"
                          value={dosageAge}
                          onChange={(e) => setDosageAge(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <Input
                          type="number"
                          placeholder="Weight"
                          value={dosageWeight}
                          onChange={(e) => setDosageWeight(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Indication</label>
                      <Input
                        placeholder="e.g., Bacterial infection"
                        value={dosageIndication}
                        onChange={(e) => setDosageIndication(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleDosageCalculation} disabled={dosageLoading} className="w-full">
                      {dosageLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        "Calculate Dosage"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {dosageResult && (
                <div className="space-y-3 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Dosage Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <strong>Standard Dosage:</strong> {dosageResult.standardDosage}
                      </div>
                      <div>
                        <strong>Adjusted Dosage:</strong> {dosageResult.adjustedDosage}
                      </div>
                      <div>
                        <strong>Frequency:</strong> {dosageResult.frequency}
                      </div>
                      {dosageResult.route && (
                        <div>
                          <strong>Route:</strong> {dosageResult.route}
                        </div>
                      )}
                      {dosageResult.duration && (
                        <div>
                          <strong>Duration:</strong> {dosageResult.duration}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {dosageResult.warnings.length > 0 && (
                    <Card className="border-red-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">Warnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {dosageResult.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {dosageResult.monitoring.length > 0 && (
                    <Card className="border-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Monitoring Parameters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {dosageResult.monitoring.map((param, i) => (
                            <li key={i}>{param}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {dosageResult.disclaimer && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        {dosageResult.disclaimer}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Clinical Decision Support Disclaimer:</strong> These AI-powered tools provide clinical decision
          support and should not replace professional medical judgment. Always verify recommendations with current
          clinical guidelines and use your clinical expertise.
        </AlertDescription>
      </Alert>
    </div>
  )
}

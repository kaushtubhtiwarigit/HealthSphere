"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, Loader2, AlertTriangle, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { MedicalImageAnalysis } from "@/lib/types"

export default function ImageAnalysisPage() {
  const { user } = useAuth()
  const params = useParams()
  const patientId = params.patientId as string | undefined
  const { toast } = useToast()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageType, setImageType] = useState<"xray" | "ct" | "mri" | "ultrasound" | "other">("xray")
  const [clinicalContext, setClinicalContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<MedicalImageAnalysis | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" })
        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!imageFile) {
      toast({ title: "Error", description: "Please select an image", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1]

        const response = await fetch("/api/clinical-tools/image-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            imageType,
            clinicalContext,
            patientId,
          }),
        })

        const data = await response.json()
        if (data.success) {
          setAnalysis(data.data)
          toast({ title: "Analysis Complete", description: "Image has been analyzed" })
        } else {
          throw new Error(data.message)
        }
        setLoading(false)
      }
      reader.readAsDataURL(imageFile)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white"
      case "significant":
        return "bg-orange-500 text-white"
      case "mild":
        return "bg-yellow-500 text-black"
      case "normal":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "low":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          <div className="flex items-center gap-4 mb-8">
            <Link href={patientId ? `/dashboard/doctor/patient/${patientId}` : "/dashboard/doctor/clinical-tools"}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold">Medical Image Analysis</h1>
              <p className="text-muted-foreground mt-2">
                AI-assisted analysis of medical images
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Image
                </CardTitle>
                <CardDescription>Upload medical image for AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Image Type</label>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                  >
                    <option value="xray">X-Ray</option>
                    <option value="ct">CT Scan</option>
                    <option value="mri">MRI</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Clinical Context (Optional)</label>
                  <textarea
                    className="w-full min-h-20 px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                    placeholder="Patient symptoms, clinical history, reason for imaging..."
                    value={clinicalContext}
                    onChange={(e) => setClinicalContext(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Select Image</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                </div>

                {imagePreview && (
                  <div className="border border-border rounded-lg p-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                )}

                <Button onClick={handleAnalyze} disabled={loading || !imageFile} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Analyze Image
                    </>
                  )}
                </Button>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This is an AI-assisted preliminary analysis. Always obtain professional radiological
                    interpretation for diagnostic purposes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  {analysis ? "AI-generated findings and impressions" : "Results will appear here"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div className="space-y-4">
                    {/* Findings */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Findings:</h3>
                      {analysis.findings.map((finding, i) => (
                        <Card key={i} className="border-l-4" style={{ borderLeftColor: finding.severity === "Critical" ? "#ef4444" : "#3b82f6" }}>
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-sm font-medium">{finding.finding}</p>
                              <Badge className={getSeverityColor(finding.severity)}>
                                {finding.severity}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Location: {finding.location}</span>
                              <Badge variant="outline" className={getConfidenceColor(finding.confidence)}>
                                {finding.confidence} Confidence
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Impression */}
                    <div>
                      <h3 className="font-semibold mb-2">Impression:</h3>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm">{analysis.impression}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Recommendations:</h3>
                        <Card>
                          <CardContent className="pt-4">
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {analysis.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <Alert variant="default">
                      <AlertDescription className="text-xs">
                        {analysis.disclaimer}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Upload and analyze an image to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

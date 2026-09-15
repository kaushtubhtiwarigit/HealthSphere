"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Shield, Phone, ChevronDown, ChevronUp } from "lucide-react"
import type { MedicationCheckResult } from "@/lib/types"

interface MedicationInteractionCardProps {
  result: MedicationCheckResult
  aiAnalysis?: string
  onContactProvider?: () => void
}

export function MedicationInteractionCard({
  result,
  aiAnalysis,
  onContactProvider,
}: MedicationInteractionCardProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [showAIAnalysis, setShowAIAnalysis] = React.useState(false)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "moderate":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "major":
        return "destructive"
      case "moderate":
        return "default"
      case "minor":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (result.interactions.length === 0 && result.duplicates.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Medication Safety Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ✓ No known interactions or duplicate therapies detected. Continue taking medications as prescribed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Medication Safety Alert
            </CardTitle>
            <CardDescription className="mt-1">{result.summary}</CardDescription>
          </div>
          <Badge className={`${getRiskColor(result.overallRisk)} text-white`}>
            {result.overallRisk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Provider CTA */}
        {result.contactProvider && (
          <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
            <Phone className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Action Required:</strong> Contact your healthcare provider to discuss these findings before
              taking your next dose.
            </AlertDescription>
          </Alert>
        )}

        {/* Toggle Details Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-xs"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Show Details
            </>
          )}
        </Button>

        {/* Details Section */}
        {showDetails && (
          <div className="space-y-4 pt-2">
            {/* Interactions */}
            {result.interactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Drug Interactions ({result.interactions.length})</h4>
                {result.interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="border border-border rounded-lg p-3 bg-muted/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {interaction.medication1} + {interaction.medication2}
                        </p>
                      </div>
                      <Badge variant={getSeverityColor(interaction.severity) as any} className="text-xs">
                        {interaction.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{interaction.description}</p>
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      {interaction.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Duplicate Therapy */}
            {result.duplicates.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Duplicate Therapy ({result.duplicates.length})</h4>
                {result.duplicates.map((duplicate) => (
                  <div
                    key={duplicate.id}
                    className="border border-border rounded-lg p-3 bg-muted/30 space-y-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{duplicate.therapeuticClass}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Medications: {duplicate.medications.join(", ")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{duplicate.description}</p>
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      {duplicate.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Section */}
        {aiAnalysis && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
              className="w-full text-xs"
            >
              {showAIAnalysis ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide AI Analysis
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show AI-Enhanced Analysis
                </>
              )}
            </Button>

            {showAIAnalysis && (
              <div className="border border-border rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20">
                <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{aiAnalysis}</pre>
                <p className="text-[10px] text-muted-foreground italic mt-2">
                  AI-generated content for informational purposes only. Not medical advice.
                </p>
              </div>
            )}
          </>
        )}

        {/* Contact Button */}
        {onContactProvider && (
          <Button onClick={onContactProvider} className="w-full gap-2" variant="default">
            <Phone className="w-4 h-4" />
            Contact Healthcare Provider
          </Button>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground italic">
          This check uses a basic interaction database and may not catch all interactions. Always consult your
          pharmacist or provider about new medications, and report any unusual symptoms immediately.
        </p>
      </CardContent>
    </Card>
  )
}

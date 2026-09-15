"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DoctorAnalyticsComponent } from "@/components/dashboards/doctor-analytics"
import type { DoctorAnalytics } from "@/lib/types"
import { ArrowLeft, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function DoctorAnalyticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<DoctorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const doctorId = (user as any)?._id?.toString?.() || user?.id

  const fetchAnalytics = async () => {
    if (!doctorId) return

    try {
      setRefreshing(true)
      const response = await fetch(`/api/analytics/doctor?doctorId=${encodeURIComponent(doctorId)}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
        toast({
          title: "Analytics updated",
          description: "Latest data has been loaded successfully",
        })
      } else {
        throw new Error(data.message || "Failed to fetch analytics")
      }
    } catch (error) {
      console.error("[Analytics] Failed to fetch analytics", error)
      toast({
        title: "Error loading analytics",
        description: error instanceof Error ? error.message : "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [doctorId])

  const handleExport = () => {
    if (!analytics) return

    // Prepare export data
    const exportData = {
      generatedAt: new Date().toISOString(),
      doctor: {
        id: doctorId,
        name: user?.name,
        email: user?.email,
      },
      ...analytics,
    }

    // Create JSON blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${doctorId}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Analytics exported",
      description: "Data has been downloaded as JSON file",
    })
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Comprehensive insights into your practice performance
                </p>
                {analytics?.metadata && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(analytics.metadata.generatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchAnalytics}
                disabled={loading || refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handleExport} disabled={!analytics || loading} className="gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Info Card */}
          {analytics?.metadata && (
            <Card className="mb-6 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Data Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Period</p>
                    <p className="font-medium">
                      {new Date(analytics.metadata.dataRange.from).toLocaleDateString()} -{" "}
                      {new Date(analytics.metadata.dataRange.to).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Patients</p>
                    <p className="font-medium">{analytics.metadata.totalDataPoints.patients}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Appointments</p>
                    <p className="font-medium">{analytics.metadata.totalDataPoints.appointments}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Records</p>
                    <p className="font-medium">{analytics.metadata.totalDataPoints.records}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Components */}
          <DoctorAnalyticsComponent analytics={analytics} loading={loading} />

          {/* Footer Note */}
          <Card className="mt-8 border-muted">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Analytics are calculated in real-time based on your current data.
                Refresh regularly to see the latest insights. Export data for external analysis or record-keeping.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  )
}

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, AlertCircle, X, Edit, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Appointment } from "@/lib/types"
import {
  getTimeRemaining,
  formatCountdown,
  getUrgencyLevel,
  formatAppointmentDate,
  formatAppointmentTime,
  combineDateTime,
  type TimeRemaining,
} from "@/lib/date-utils"

interface AppointmentCountdownCardProps {
  appointment: Appointment
  onUpdate?: (updatedAppointment: Appointment) => void
  onCancel?: (appointmentId: string) => void
}

export function AppointmentCountdownCard({
  appointment,
  onUpdate,
  onCancel,
}: AppointmentCountdownCardProps) {
  const { toast } = useToast()
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

    // Memoize appointment datetime to prevent recalculation on every render
    const appointmentDateTime = useMemo(
      () => combineDateTime(appointment.date, appointment.time || "09:00"),
      [appointment.date, appointment.time]
    )

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      setTimeRemaining(getTimeRemaining(appointmentDateTime))
    }

    // Initial update
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [appointmentDateTime])

  const handleCancel = async () => {
    if (!appointment.id && !appointment._id) return

    setCancelling(true)
    try {
      const appointmentId = appointment.id || (appointment._id as any)?.toString()
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancellationReason: cancellationReason || "Patient requested cancellation",
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel appointment")
      }

      toast({
        title: "✅ Appointment cancelled",
        description: "Your appointment has been successfully cancelled."
      })
      
      onCancel?.(appointmentId)
      setShowCancelDialog(false)
    } catch (error) {
      console.error("Failed to cancel appointment:", error)
      toast({
        title: "❌ Cancellation failed",
        description: error instanceof Error ? error.message : "Failed to cancel appointment",
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleReschedule = () => {
    setRescheduling(true)
    // In a real implementation, this would open a reschedule modal/page
    // For now, we'll just show a toast
    toast({
      title: "Reschedule feature",
      description: "Navigate to appointments page to reschedule this appointment."
    })
    setRescheduling(false)
  }

  if (!timeRemaining) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const urgency = getUrgencyLevel(timeRemaining)
  const countdownText = formatCountdown(timeRemaining)

  // Urgency colors
  const urgencyColors = {
    critical: "border-red-500 bg-red-50/50 dark:bg-red-950/20",
    high: "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20",
    medium: "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
    low: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    past: "border-gray-400 bg-gray-50/50 dark:bg-gray-900/20",
  }

  const urgencyBadges = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-white",
    low: "bg-blue-500 text-white",
    past: "bg-gray-500 text-white",
  }

  return (
    <>
      <Card className={`${urgencyColors[urgency]} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Next Appointment
              </CardTitle>
              <CardDescription className="mt-1">
                {appointment.reason || "General consultation"}
              </CardDescription>
            </div>
            <Badge className={urgencyBadges[urgency]}>
              {urgency === "past" ? "PAST" : urgency.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Countdown Display */}
          <div className="text-center py-4 px-3 bg-white/60 dark:bg-black/20 rounded-lg border border-border">
            {urgency === "critical" && (
              <Alert className="mb-3 bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Your appointment is starting soon! Please prepare to arrive or join.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <div className="text-3xl font-bold tracking-tight">
                {timeRemaining.isPast ? "Appointment Passed" : countdownText}
              </div>
              {!timeRemaining.isPast && (
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {timeRemaining.isToday
                    ? "Today"
                    : timeRemaining.isTomorrow
                      ? "Tomorrow"
                      : "Time Remaining"}
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formatAppointmentDate(appointment.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formatAppointmentTime(appointment.time || "09:00")}</span>
            </div>
          </div>

          {/* Quick Actions */}
          {!timeRemaining.isPast && appointment.status === "scheduled" && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleReschedule}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={rescheduling}
              >
                <Edit className="w-4 h-4" />
                Reschedule
              </Button>
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="outline"
                size="sm"
                className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}

          {/* Past appointment notice */}
          {timeRemaining.isPast && (
            <Alert className="bg-muted/50">
              <AlertDescription className="text-xs">
                This appointment has passed. If you missed it, please contact your provider to reschedule.
              </AlertDescription>
            </Alert>
          )}

          {/* Cancelled status */}
          {appointment.status === "cancelled" && (
            <Alert className="bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-900">
              <X className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                This appointment was cancelled.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your appointment on{" "}
              {formatAppointmentDate(appointment.date)} at {formatAppointmentTime(appointment.time || "09:00")}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're cancelling..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelling}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

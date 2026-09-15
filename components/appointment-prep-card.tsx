"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Calendar, 
  CheckCircle2, 
  FileText, 
  ClipboardList, 
  MessageCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import type { AppointmentPrepPack, PrepChecklistItem } from "@/lib/types"

interface AppointmentPrepCardProps {
  prepPack: AppointmentPrepPack
  onChecklistChange?: (itemId: string, completed: boolean) => void
}

export function AppointmentPrepCard({ prepPack, onChecklistChange }: AppointmentPrepCardProps) {
  const [checklist, setChecklist] = React.useState<PrepChecklistItem[]>(prepPack.checklist)
  const [showQuestions, setShowQuestions] = React.useState(false)
  const [showDocuments, setShowDocuments] = React.useState(false)
  const [showThingsToMention, setShowThingsToMention] = React.useState(false)

  const completedCount = checklist.filter((item) => item.completed).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, completed: checked } : item))
    )
    onChecklistChange?.(itemId, checked)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "documents":
        return <FileText className="w-3 h-3" />
      case "symptoms":
        return <AlertCircle className="w-3 h-3" />
      case "questions":
        return <MessageCircle className="w-3 h-3" />
      case "medications":
        return <ClipboardList className="w-3 h-3" />
      case "lifestyle":
        return <CheckCircle2 className="w-3 h-3" />
      default:
        return <ClipboardList className="w-3 h-3" />
    }
  }

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Appointment Preparation Pack
            </CardTitle>
            <CardDescription className="mt-1">
              {prepPack.appointmentReason} • {new Date(prepPack.appointmentDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-sm text-muted-foreground">{prepPack.summary}</p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedCount}/{totalCount} completed
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Preparation Checklist
          </h4>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm flex-1 cursor-pointer ${
                    item.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {getCategoryIcon(item.category)}
                      <span className="ml-1">{item.category}</span>
                    </Badge>
                    <span className="flex-1">{item.text}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Questions to Ask */}
        {prepPack.questionsToAsk.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestions(!showQuestions)}
              className="w-full text-xs justify-between"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Questions to Ask Your Doctor ({prepPack.questionsToAsk.length})
              </span>
              {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showQuestions && (
              <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
                <ul className="space-y-2">
                  {prepPack.questionsToAsk.map((question, index) => (
                    <li key={index} className="text-sm flex gap-2">
                      <span className="text-blue-600 font-medium">{index + 1}.</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-muted-foreground italic mt-3">
                  💡 Tip: Write down the answers during your appointment or ask for a summary.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Things to Mention */}
        {prepPack.thingsToMention.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThingsToMention(!showThingsToMention)}
              className="w-full text-xs justify-between"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Important Things to Mention ({prepPack.thingsToMention.length})
              </span>
              {showThingsToMention ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showThingsToMention && (
              <div className="border border-border rounded-lg p-3 bg-yellow-50/50 dark:bg-yellow-950/20 space-y-2">
                <ul className="space-y-1.5">
                  {prepPack.thingsToMention.map((item, index) => (
                    <li key={index} className="text-xs flex gap-2">
                      <span>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Documents Needed */}
        {prepPack.documentsNeeded.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocuments(!showDocuments)}
              className="w-full text-xs justify-between"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents to Bring ({prepPack.documentsNeeded.length})
              </span>
              {showDocuments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showDocuments && (
              <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
                <ul className="space-y-1.5">
                  {prepPack.documentsNeeded.map((doc, index) => (
                    <li key={index} className="text-xs flex gap-2">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-600" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground italic">
          This preparation pack is a guide based on your appointment details and medical history. Your provider may
          have additional requirements—confirm with their office if unsure.
        </p>
      </CardContent>
    </Card>
  )
}

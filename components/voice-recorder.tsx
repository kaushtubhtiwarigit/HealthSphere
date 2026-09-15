"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoiceRecorderProps {
  onTranscriptionComplete?: (formattedNotes: string, extractedData: any) => void
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcription, setTranscription] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        await processAudio(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast({ title: "Recording started", description: "Speak your clinical notes" })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast({ title: "Recording stopped", description: "Processing audio..." })
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    
    try {
      // For now, we'll simulate transcription since we don't have a speech-to-text API set up
      // In production, you'd use Google Cloud Speech-to-Text, Whisper API, etc.
      
      // Simulate transcription delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      const mockTranscription = `Patient presents with chief complaint of persistent cough for the past week. 
History of present illness includes fever starting 3 days ago, temperature up to 101°F. 
Patient denies shortness of breath. No recent travel history. 
Physical examination reveals clear lung sounds bilaterally. 
Assessment: Likely upper respiratory tract infection. 
Plan: Symptomatic treatment with rest, hydration, and over-the-counter medications. 
Follow-up if symptoms worsen or persist beyond 7 days.`

      setTranscription(mockTranscription)

      // Process with AI to extract entities
      const response = await fetch("/api/clinical-tools/process-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcribedText: mockTranscription }),
      })

      const data = await response.json()
      if (data.success) {
        if (onTranscriptionComplete) {
          onTranscriptionComplete(data.data.formattedNotes, data.data)
        }
        toast({
          title: "Transcription Complete",
          description: "Clinical notes have been processed",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Clinical Notes
        </CardTitle>
        <CardDescription>
          Record and transcribe your clinical notes with AI-powered entity extraction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <Button onClick={startRecording} disabled={isProcessing} className="gap-2">
              <Mic className="w-4 h-4" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="gap-2">
              <Square className="w-4 h-4" />
              Stop Recording
            </Button>
          )}

          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              Recording...
            </Badge>
          )}

          {isProcessing && (
            <Badge variant="outline" className="gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </Badge>
          )}
        </div>

        {transcription && (
          <div className="border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              <span className="font-semibold text-sm">Transcription:</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{transcription}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>💡 <strong>Tip:</strong> Speak clearly and use medical terminology. The AI will extract symptoms, diagnoses, and medications automatically.</p>
          <p className="mt-1">📝 <strong>Note:</strong> This is a demo feature. In production, it would use real speech-to-text API.</p>
        </div>
      </CardContent>
    </Card>
  )
}

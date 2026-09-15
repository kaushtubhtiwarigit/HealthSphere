"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useParams, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Bot, 
  User as UserIcon,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
  BookOpen,
  Download,
  Save,
  AlertCircle,
  Loader2
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
const Markdown: any = ReactMarkdown
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

type ChatMessage = { role: "user" | "assistant"; content: string }
type ClinicalTool = "diagnosis" | "interactions" | "dosage" | "literature"

export default function AISuggestionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const params = useParams()
  const searchParams = useSearchParams()
  const patientId = params.id as string

  // Pre-fill from query if provided (backward compatibility)
  const presetDiagnosis = searchParams.get("diagnosis") || ""
  const presetSymptoms = searchParams.get("symptoms")?.split(",")?.filter(Boolean) || []

  // Form state
  const [diagnosis, setDiagnosis] = useState<string>(presetDiagnosis)
  const [symptoms, setSymptoms] = useState<string>(presetSymptoms.join(", "))
  const [condition, setCondition] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Main results state
  const [suggestions, setSuggestions] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [copied, setCopied] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState<string>("")
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  
  // Clinical tools state
  const [activeTab, setActiveTab] = useState<string>("suggestions")
  const [clinicalToolsData, setClinicalToolsData] = useState<Record<ClinicalTool, any>>({
    diagnosis: null,
    interactions: null,
    dosage: null,
    literature: null
  })
  const [toolLoading, setToolLoading] = useState<ClinicalTool | null>(null)
  
  // Patient context
  const [patientContext, setPatientContext] = useState<any>(null)

  // Persist & load existing chat history
  useEffect(() => {
    let ignore = false
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/ai-chats?patientId=${encodeURIComponent(patientId)}&doctorId=${encodeURIComponent(user?.id || (user as any)?._id || "")}`)
        const data = await res.json()
        if (!ignore && data?.success && data?.item?.messages) {
          setMessages(data.item.messages)
          // If there's an initial assistant message, set it as suggestions to enable chat
          if (data.item.messages.length > 0 && data.item.messages[0].role === "assistant") {
            setSuggestions(data.item.messages[0].content)
          }
        }
      } catch (e) {
        console.warn("Failed to load chat history", e)
      }
    }
    if (user?.role === "doctor" || user?.role === "admin") loadHistory()
    return () => {
      ignore = true
    }
  }, [patientId, user?.id, user?.role])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          condition,
          diagnosis,
          symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to generate suggestions")
      setSuggestions(data.suggestions || "")
      // seed chat with the assistant's initial summary
      setMessages((prev) => prev.length ? prev : [{ role: "assistant", content: data.suggestions || "" }])
      // Persist initial suggestions
      const doctorId = user?.id || (user as any)?._id || ""
      if (doctorId) {
        fetch(`/api/ai-chats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, doctorId, messages: [{ role: "assistant", content: data.suggestions || "" }] }),
        }).catch((e) => console.warn("Persist initial chat failed", e))
      }
    } catch (err: any) {
      console.error("AI suggestions error", err)
      setError(err?.message || "Failed to generate suggestions")
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    const newHistory: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(newHistory)
    setChatInput("")
    try {
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, messages: newHistory }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success || !data?.message) throw new Error(data?.message || "Chat failed")
      setMessages((prev) => [...prev, data.message as ChatMessage])
      // Persist chat
      const doctorId = user?.id || (user as any)?._id || ""
      if (doctorId) {
        fetch(`/api/ai-chats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, doctorId, messages: [...newHistory, data.message] }),
        }).catch((e) => console.warn("Persist chat failed", e))
      }
    } catch (err: any) {
      console.error("AI chat error", err)
      setError(err?.message || "Chat failed")
    }
  }

  return (
    <ProtectedRoute>
  <main className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/dashboard/doctor/patient/${patientId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-balance flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                AI Treatment Assistant
              </h1>
              <p className="text-muted-foreground mt-1">Give the current condition. We'll combine it with patient records to propose options.</p>
            </div>
          </div>

          {/* Alert */}
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-600">
              These are AI-generated suggestions based on the diagnosis and symptoms. Always verify with clinical
              judgment and current guidelines before prescribing.
            </AlertDescription>
          </Alert>

          {/* 40:60 Split */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left Pane (40%) */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Condition</CardTitle>
                <CardDescription>Describe what's going on now</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>
                )}
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Working Diagnosis (optional)</label>
                    <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g., Type 2 Diabetes" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Symptoms (comma-separated)</label>
                    <Input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g., Increased thirst, Fatigue" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chief Complaint / Presenting Condition</label>
                    <textarea
                      className="w-full min-h-24 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Describe current condition, vitals, onset, severity, triggers, etc."
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Additional Notes (optional)</label>
                    <textarea
                      className="w-full min-h-24 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      placeholder="Anything else relevant for AI to consider"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Generating..." : "Generate Suggestions"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Right Pane (60%) */}
            <div className="md:col-span-3 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>AI Suggestions</CardTitle>
                    <CardDescription>
                      {diagnosis ? `Diagnosis: ${diagnosis} | ` : ""}
                      {symptoms ? `Symptoms: ${symptoms}` : ""}
                    </CardDescription>
                  </div>
                  {!loading && suggestions && (
                    <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2 bg-transparent">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                        <p className="text-muted-foreground">Generating AI suggestions...</p>
                      </div>
                    </div>
                  ) : suggestions ? (
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                      <Markdown remarkPlugins={[remarkGfm as any]}>
                        {suggestions}
                      </Markdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Fill the left panel and click Generate.</p>
                  )}
                </CardContent>
              </Card>

              {/* Chat */}
              <Card>
                <CardHeader>
                  <CardTitle>Ask Follow-Up Questions</CardTitle>
                  <CardDescription>Get quick answers about this patient's care - ask anything!</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                    {messages.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No messages yet. Generate suggestions first, then ask questions like "What about diet?" or "Any drug interactions?"</p>
                    ) : (
                      messages.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          {m.role === "assistant" && <Bot className="w-4 h-4 mt-1 text-primary" />}
                          <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {m.role === "assistant" ? (
                              <div className="prose prose-invert max-w-none">
                                <Markdown remarkPlugins={[remarkGfm as any]}>
                                  {m.content}
                                </Markdown>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap">{m.content}</div>
                            )}
                          </div>
                          {m.role === "user" && <UserIcon className="w-4 h-4 mt-1 text-muted-foreground" />}
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                    <Input
                      placeholder="e.g., What about dietary changes? Any alternatives to metformin?"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={!suggestions}
                    />
                    <Button type="submit" disabled={!chatInput.trim() || !suggestions} className="gap-2">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-6">
            <Link href={`/dashboard/doctor/patient/${patientId}`} className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Patient
              </Button>
            </Link>
            <Link href={`/dashboard/doctor/patient/${patientId}`} className="flex-1">
              <Button className="w-full">Use These Suggestions</Button>
            </Link>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

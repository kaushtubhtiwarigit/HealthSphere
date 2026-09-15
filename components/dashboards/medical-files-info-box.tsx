import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { MedicalFileInfo } from "@/lib/types"

interface MedicalFilesInfoBoxProps {
  files: MedicalFileInfo[]
}

export function MedicalFilesInfoBox({ files }: MedicalFilesInfoBoxProps) {
  if (!files || files.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Uploaded Medical Files ({files.length})</CardTitle>
        <CardDescription className="text-xs">AI–extracted structured details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files.map((info, idx) => (
            <FileDetails key={idx} info={info} index={idx} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FileDetails({ info, index }: { info: MedicalFileInfo; index: number }) {
  const [showRaw, setShowRaw] = useState(false)
  const details = info.details || {}

  // Extract common structured fields if they exist
  const keyValues: Array<any> = Array.isArray(details.key_values) ? details.key_values : []
  const topLevelEntries = Object.entries(details)
    .filter(([k]) => k !== "key_values" && k !== "raw_text")
    .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    .slice(0, 25) // safety cap

  return (
    <div className="border rounded-md p-3 bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>Uploaded: {info.uploadedAt ? new Date(info.uploadedAt).toLocaleString() : "—"}</div>
          {info.category && (
            <div className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
              {info.category.replace(/_/g, " ")}
            </div>
          )}
        </div>
  <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShowRaw((s) => !s)}>
          {showRaw ? "Hide JSON" : "Raw JSON"}
        </Button>
      </div>
      <h3 className="font-semibold text-sm mb-2">{info.summary || "No summary"}</h3>

      {/* Preview asset if available */}
      {info.url && (
        <div className="mb-3">
          {info.mimeType?.startsWith("image") ? (
            <a
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border rounded overflow-hidden group"
            >
              <img
                src={info.thumbnailUrl || info.url}
                alt={info.originalFileName || "medical file"}
                className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                loading="lazy"
              />
            </a>
          ) : (
            <div className="flex items-center justify-between text-xs bg-muted/40 rounded p-2">
              <span>{info.originalFileName || info.publicId || "File"}</span>
              <a
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Open
              </a>
            </div>
          )}
        </div>
      )}

      {keyValues.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1">Key Values</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded-md">
              <thead className="bg-muted">
                <tr>
                  <th className="py-1 px-2 text-left font-semibold">Label</th>
                  <th className="py-1 px-2 text-left font-semibold">Value</th>
                  <th className="py-1 px-2 text-left font-semibold">Units</th>
                  <th className="py-1 px-2 text-left font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody>
                {keyValues.map((kv, i) => (
                  <tr key={i} className="odd:bg-background">
                    <td className="py-1 px-2">{kv.label || "—"}</td>
                    <td className="py-1 px-2">{kv.value || "—"}</td>
                    <td className="py-1 px-2">{kv.units || ""}</td>
                    <td className="py-1 px-2">{kv.reference_range || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {topLevelEntries.length > 0 && (
        <div className="space-y-1 mb-2">
          <p className="text-xs font-medium">Details</p>
          <div className="grid grid-cols-1 gap-1">
            {topLevelEntries.map(([k, v]) => (
              <div key={k} className="text-xs flex">
                <span className="font-medium mr-1 capitalize">{formatKey(k)}:</span>
                <span className="text-muted-foreground wrap-break-word">{formatValue(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {details.raw_text && (
        <div className="mb-2">
          <p className="text-xs font-medium">Raw Text</p>
          <div className="text-[10px] bg-muted/20 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
            {details.raw_text}
          </div>
        </div>
      )}

      {showRaw && (
        <div className="mt-2">
          <Separator className="my-2" />
          <p className="text-xs font-medium mb-1">Raw JSON</p>
          <pre className="text-[10px] leading-tight bg-muted/20 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function formatKey(key: string) {
  return key.replace(/_/g, " ")
}

function formatValue(value: any): string {
  if (value === null) return "—"
  if (Array.isArray(value)) {
    if (value.length === 0) return "—"
    // Render primitive array succinctly
    if (value.every((v) => typeof v !== "object")) return value.join(", ")
    // For array of objects, show count
    return `${value.length} items`
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).slice(0, 3).map(([k, v]) => `${k}:${truncate(String(v), 20)}`)
    return entries.join("; ") + (Object.keys(value).length > 3 ? " …" : "")
  }
  const str = String(value)
  return truncate(str, 100)
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}

import { NextResponse, type NextRequest } from "next/server"
import { getCollection } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || undefined
    const q = (searchParams.get("q") || "").toLowerCase()
    console.log("[API] /api/users GET", {
      role: role || null,
      hasQuery: q.length > 0,
      url: request.url,
    })

    const usersCol = await getCollection("users")
    console.log("[API] /api/users GET collection ready")
    const filter: Record<string, any> = {}
    if (role) filter.role = role
    console.log("[API] /api/users GET filter", filter)

    const items = await usersCol.find(filter).sort({ createdAt: -1 }).toArray()
    console.log("[API] /api/users GET query complete", { rawCount: items.length })

    const filtered = q
      ? items.filter((u: any) => {
          const name = (u.name || `${u.firstName || ""} ${u.lastName || ""}`).toLowerCase()
          return name.includes(q) || (u.email || "").toLowerCase().includes(q)
        })
      : items
    console.log("[API] /api/users GET post-filter", { count: filtered.length })

    console.log("[API] /api/users GET success", { count: filtered.length })
    return NextResponse.json({ success: true, items: filtered })
  } catch (error) {
    console.error("[API] /api/users GET error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}



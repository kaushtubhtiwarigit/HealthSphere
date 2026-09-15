import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"

import { getCollection } from "@/lib/db"

export const runtime = "nodejs" // Set to nodejs for MongoDB compatibility

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Support both sync and async params (Next.js 15 compatibility)
    const params = await Promise.resolve(context.params)
    const { id } = params
    
    console.log("[API] GET /api/users/[id] - ID:", id)
    
    if (!id) {
      return NextResponse.json({ success: false, message: "User id is required" }, { status: 400 })
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error("[API] Invalid ObjectId format:", id)
      return NextResponse.json({ success: false, message: "Invalid user id format" }, { status: 400 })
    }

    const users = await getCollection("users")
    const objectId = new ObjectId(id)

    const user = await users.findOne({ _id: objectId })
    if (!user) {
      console.log("[API] User not found:", id)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    console.log("[API] User found, medical files count:", user.medicalFilesInformation?.length || 0)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("[API] /api/users/[id] GET error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params)
    const { id } = params
    if (!id) {
      return NextResponse.json({ success: false, message: "User id is required" }, { status: 400 })
    }

    const users = await getCollection("users")
    const objectId = new ObjectId(id)

    const result = await users.deleteOne({ _id: objectId })
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] /api/users/[id] DELETE error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params)
    const { id } = params
    console.log('[API][PATCH] Called for user id:', id)
    if (!id) {
      console.error('[API][PATCH] No user id provided')
      return NextResponse.json({ success: false, message: "User id is required" }, { status: 400 })
    }

    const payload = await request.json()
    // Avoid updating protected fields
    delete payload._id
    delete payload.id
    console.log('[API][PATCH] Payload:', payload)

    const users = await getCollection("users")
    let objectId
    try {
      objectId = new ObjectId(id)
    } catch (e) {
      console.error('[API][PATCH] Invalid ObjectId:', id)
      return NextResponse.json({ success: false, message: "Invalid user id format" }, { status: 400 })
    }

    const result = await users.findOneAndUpdate(
      { _id: objectId },
      { $set: payload },
      { returnDocument: "after" },
    )
    console.log('[API][PATCH] findOneAndUpdate result:', result)

    // Accept both result.value (MongoDB v4+) and result (older/other drivers)
    const updatedUser = result?.value || (result && result._id ? result : null)
    if (!updatedUser) {
      console.error('[API][PATCH] User not found for id:', id)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    console.log('[API][PATCH] User updated successfully:', updatedUser)
    return NextResponse.json({ success: true, item: updatedUser })
  } catch (error) {
    console.error("[API] /api/users/[id] PATCH error", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    )
  }
}


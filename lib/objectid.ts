import { ObjectId } from "mongodb"

export function toObjectId(id: string | undefined | null): ObjectId | undefined {
  if (!id) return undefined
  try {
    return new ObjectId(id)
  } catch {
    return undefined
  }
}

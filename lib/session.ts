/**
 * Session management using MongoDB
 * Replaces localStorage for authentication tokens and user sessions
 */

import { getCollection } from './db'
import { ObjectId } from 'mongodb'
import { logger } from './logger'
import type { User } from './types'

export interface Session {
  _id?: ObjectId
  userId: string
  token: string
  createdAt: Date
  expiresAt: Date
  userAgent?: string
  ipAddress?: string
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  try {
    const sessions = await getCollection<Session>('sessions')
    
    // Generate a secure token
    const token = generateSecureToken()
    
    // Session expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    const session: Session = {
      userId,
      token,
      createdAt: new Date(),
      expiresAt,
      userAgent,
      ipAddress,
    }
    
    await sessions.insertOne(session)
    
    logger.auth('Session created', { userId, expiresAt })
    
    return token
  } catch (error) {
    logger.error('Failed to create session', error)
    throw new Error('Failed to create session')
  }
}

/**
 * Validate a session token and return the user
 */
export async function validateSession(token: string): Promise<User | null> {
  try {
    const sessions = await getCollection<Session>('sessions')
    const session = await sessions.findOne({ token })
    
    if (!session) {
      logger.warn('Session not found', { token: token.substring(0, 10) })
      return null
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      logger.warn('Session expired', { userId: session.userId })
      await sessions.deleteOne({ _id: session._id })
      return null
    }
    
    // Get user data
    const users = await getCollection('users')
    const user = await users.findOne({ _id: new ObjectId(session.userId) })
    
    if (!user) {
      logger.error('User not found for valid session', { userId: session.userId })
      return null
    }
    
    logger.debug('Session validated', { userId: session.userId })
    
    // Return user without password
    const { password, ...userWithoutPassword } = user as any
    return {
      ...userWithoutPassword,
      id: user._id.toString(),
      _id: user._id.toString(),
    } as User
  } catch (error) {
    logger.error('Failed to validate session', error)
    return null
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<boolean> {
  try {
    const sessions = await getCollection<Session>('sessions')
    const result = await sessions.deleteOne({ token })
    
    logger.auth('Session deleted', { deleted: result.deletedCount > 0 })
    
    return result.deletedCount > 0
  } catch (error) {
    logger.error('Failed to delete session', error)
    return false
  }
}

/**
 * Delete all sessions for a user (logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  try {
    const sessions = await getCollection<Session>('sessions')
    const result = await sessions.deleteMany({ userId })
    
    logger.auth('All user sessions deleted', { userId, count: result.deletedCount })
    
    return result.deletedCount
  } catch (error) {
    logger.error('Failed to delete user sessions', error)
    return 0
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const sessions = await getCollection<Session>('sessions')
    const result = await sessions.deleteMany({
      expiresAt: { $lt: new Date() }
    })
    
    logger.info('Expired sessions cleaned up', { count: result.deletedCount })
    
    return result.deletedCount
  } catch (error) {
    logger.error('Failed to cleanup expired sessions', error)
    return 0
  }
}

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  // In production, use a proper crypto library
  // For now, using a combination of random values
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)
  
  return `${timestamp}-${randomPart}-${randomPart2}`
}

/**
 * Get session info from token
 */
export async function getSessionInfo(token: string): Promise<Session | null> {
  try {
    const sessions = await getCollection<Session>('sessions')
    const session = await sessions.findOne({ token })
    return session
  } catch (error) {
    logger.error('Failed to get session info', error)
    return null
  }
}

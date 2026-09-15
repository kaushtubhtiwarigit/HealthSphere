/**
 * Authentication middleware helper
 * Use this in API routes to validate sessions and get authenticated user
 */

import { type NextRequest } from "next/server";
import { validateSession } from "./session";
import { logger } from "./logger";
import type { User } from "./types";

export interface AuthResult {
  authenticated: boolean;
  user: User | null;
  error?: string;
}

/**
 * Extract and validate token from request
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      logger.debug('No token provided in request');
      return {
        authenticated: false,
        user: null,
        error: 'No authentication token provided'
      };
    }

    // Validate session
    const user = await validateSession(token);

    if (!user) {
      logger.warn('Invalid or expired token');
      return {
        authenticated: false,
        user: null,
        error: 'Invalid or expired token'
      };
    }

    logger.debug('Request authenticated', { userId: user.id });
    
    return {
      authenticated: true,
      user
    };
  } catch (error) {
    logger.error('Authentication failed', error);
    return {
      authenticated: false,
      user: null,
      error: 'Authentication failed'
    };
  }
}

/**
 * Require authentication for a route
 * Returns user if authenticated, throws error otherwise
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const result = await authenticateRequest(request);
  
  if (!result.authenticated || !result.user) {
    throw new Error(result.error || 'Authentication required');
  }
  
  return result.user;
}

/**
 * Require specific role for a route
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<User> {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.role)) {
    logger.warn('Unauthorized role access attempt', { 
      userId: user.id, 
      userRole: user.role, 
      allowedRoles 
    });
    throw new Error('Insufficient permissions');
  }
  
  return user;
}

import { type NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    logger.apiRequest('POST', '/api/auth/logout', { hasToken: !!token });

    if (!token) {
      logger.warn('Logout attempt without token');
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 400 });
    }

    const deleted = await deleteSession(token);

    if (deleted) {
      logger.auth('User logged out successfully', { token: token.substring(0, 10) });
      logger.apiResponse('POST', '/api/auth/logout', 200);
      return NextResponse.json({ success: true, message: "Logged out successfully" });
    } else {
      logger.warn('Logout attempt with invalid token');
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 400 });
    }
  } catch (error) {
    logger.error('Logout failed', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

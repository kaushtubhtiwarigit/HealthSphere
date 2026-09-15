import { type NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { createSession } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    logger.apiRequest('POST', '/api/auth/login', { email });

    if (!email || !password) {
      logger.warn('Login attempt with missing credentials');
      return NextResponse.json({ success: false, message: "Email and password required" }, { status: 400 });
    }

    const users = await getCollection("users");
    logger.dbOperation('findOne', 'users', { email });
    const user = await users.findOne({ email });

    if (!user) {
      logger.warn('Login attempt for non-existent user', { email });
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // For demo: compare plain text passwords. In production, use hashed passwords!
    if (user.password !== password) {
      logger.warn('Invalid password attempt', { email });
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    // Create session in MongoDB
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const token = await createSession(user._id.toString(), userAgent, ipAddress);

    const response = {
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        name: user.fullName,
        id: user._id?.toString?.(),
        availableSlots: user.availableSlots || [],
      },
    };
    
    logger.auth('User logged in successfully', { userId: user._id.toString(), email: user.email });
    logger.apiResponse('POST', '/api/auth/login', 200, { userId: user._id.toString() });
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Login failed', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

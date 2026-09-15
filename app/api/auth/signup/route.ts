import { type NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { createSession } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json();
    logger.apiRequest('POST', '/api/auth/signup', { email, role });

    if (!email || !password || !fullName  || !role) {
      logger.warn('Signup attempt with missing fields');
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const users = await getCollection("users");
    logger.dbOperation('findOne', 'users', { email });

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      logger.warn('Signup attempt for existing user', { email });
      return NextResponse.json({ success: false, message: "User already exists" }, { status: 409 });
    }

    // For demo: store plain password. In production, hash the password!
    const newUser = {
      email,
      password,
      fullName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    logger.dbOperation('insertOne', 'users', { email, role });
    const result = await users.insertOne(newUser);

    // Create session in MongoDB
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const token = await createSession(result.insertedId.toString(), userAgent, ipAddress);

    const response = {
      success: true,
      message: "User created successfully",
      token,
      user: {
        _id: result.insertedId,
        email,
        fullName,
        role,
        id: result.insertedId.toString(),
        availableSlots: [],
      },
    };
    
    logger.auth('User signed up successfully', { userId: result.insertedId.toString(), email });
    logger.apiResponse('POST', '/api/auth/signup', 200, { userId: result.insertedId.toString() });
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Signup failed', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

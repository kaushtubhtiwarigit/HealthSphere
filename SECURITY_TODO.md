# Security Implementation TODO

⚠️ **CRITICAL**: This document lists security vulnerabilities that MUST be addressed before production deployment.

## 🔴 Critical - Must Fix Before Production

### 1. Password Hashing
**Status**: ❌ NOT IMPLEMENTED  
**Current State**: Passwords stored in plain text  
**Location**: `app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`

**Current Code (INSECURE)**:
```typescript
// app/api/auth/signup/route.ts
const newUser = {
  _id: new ObjectId(),
  email,
  password, // ⚠️ PLAIN TEXT!
  fullName,
  role,
  createdAt: new Date(),
};
```

**Required Fix**:
```typescript
import bcrypt from 'bcryptjs';

// Hash password on signup
const hashedPassword = await bcrypt.hash(password, 10);
const newUser = {
  _id: new ObjectId(),
  email,
  password: hashedPassword, // ✅ Hashed
  fullName,
  role,
  createdAt: new Date(),
};

// Verify password on login
const isValid = await bcrypt.compare(password, user.password);
if (!isValid) {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
```

**Installation Required**:
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### 2. Session Token Security
**Status**: ⚠️ PARTIALLY IMPLEMENTED  
**Current State**: Random tokens generated, but no signing/encryption  
**Location**: `lib/session.ts`

**Current Code**:
```typescript
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex'); // Basic random token
  // ...
}
```

**Recommended Improvements**:
- Use signed JWT tokens with `jsonwebtoken` or `jose`
- Add HMAC signing to prevent token tampering
- Include expiration time in token payload
- Store session secret in environment variables

**Example with JWT**:
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId, role: user.role },
  process.env.SESSION_SECRET!,
  { expiresIn: '7d' }
);
```

### 3. Environment Variable Validation
**Status**: ⚠️ PARTIALLY IMPLEMENTED  
**Current State**: No validation of required env variables  
**Location**: All API routes

**Required Fix**:
Create `lib/env.ts`:
```typescript
const requiredEnvVars = ['MONGODB_URI', 'GEMINI_API_KEY', 'SESSION_SECRET'] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Call at app startup
validateEnv();
```

### 4. Input Validation & Sanitization
**Status**: ⚠️ BASIC VALIDATION ONLY  
**Current State**: Basic checks, no sanitization  
**Location**: All API routes

**Current Issues**:
- No sanitization of user input
- No protection against NoSQL injection
- No rate limiting on API endpoints

**Required Fixes**:
```typescript
import { z } from 'zod';

// Define strict schemas
const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(100),
  role: z.enum(['patient', 'doctor', 'admin']),
});

// Validate all inputs
const validated = signupSchema.parse(body);

// Sanitize MongoDB queries to prevent injection
const sanitizedEmail = email.replace(/[$]/g, ''); // Basic example
```

## 🟡 Important - Should Implement

### 5. Rate Limiting
**Status**: ❌ NOT IMPLEMENTED  
**Purpose**: Prevent brute force attacks on login

**Recommended Solution**:
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});
```

### 6. HTTPS Enforcement
**Status**: ⚠️ DEPENDS ON DEPLOYMENT  
**Purpose**: Encrypt data in transit

**Required for Production**:
- Enable HTTPS on hosting platform (Vercel does this automatically)
- Set secure cookie flags in session management
- Add HSTS headers

### 7. CSRF Protection
**Status**: ❌ NOT IMPLEMENTED  
**Purpose**: Prevent cross-site request forgery

**Required Fix**:
```typescript
// Add CSRF tokens to forms
// Verify tokens on state-changing operations (POST, PUT, DELETE)
```

### 8. Secure Headers
**Status**: ⚠️ DEFAULT NEXT.JS HEADERS ONLY

**Add to `next.config.js`**:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

## 🟢 Nice to Have

### 9. Audit Logging
**Status**: ❌ NOT IMPLEMENTED  
**Purpose**: Track security-relevant events

**Recommended**:
- Log all authentication attempts (success/failure)
- Log access to sensitive data (medical records)
- Log admin actions (user creation, role changes)

### 10. Two-Factor Authentication
**Status**: ❌ NOT IMPLEMENTED  
**Purpose**: Add extra security layer

**Recommended for**:
- Doctor accounts (access to patient data)
- Admin accounts (system-wide privileges)

## Implementation Priority

### Phase 1: Critical (Before ANY Production Use)
1. ✅ Password hashing with bcrypt
2. ✅ Environment variable validation
3. ✅ Input validation with Zod schemas
4. ✅ Signed session tokens (JWT)

### Phase 2: Important (Before Public Deployment)
5. ✅ Rate limiting on auth endpoints
6. ✅ HTTPS enforcement
7. ✅ Secure HTTP headers
8. ✅ CSRF protection

### Phase 3: Recommended (For Healthcare Compliance)
9. ✅ Audit logging
10. ✅ Two-factor authentication
11. ✅ HIPAA compliance review
12. ✅ Encryption at rest for sensitive data

## Testing Security

### Current State
- ❌ No security tests
- ❌ No penetration testing
- ❌ No dependency vulnerability scanning

### Recommended Tools
```bash
# Check for vulnerabilities in dependencies
npm audit

# Fix automatically
npm audit fix

# Use Snyk for continuous monitoring
npm install -g snyk
snyk test
```

## Compliance Considerations

⚠️ **IMPORTANT**: If handling real patient data, this system MUST comply with:

- **HIPAA** (US Healthcare)
  - Encrypt PHI (Protected Health Information)
  - Implement access controls
  - Maintain audit trails
  - Business Associate Agreements with third parties (MongoDB Atlas, Gemini API)

- **GDPR** (EU/UK)
  - Right to be forgotten (data deletion)
  - Data portability
  - Consent management
  - Data breach notification

**Current Status**: ❌ NOT COMPLIANT - This is a demo application only

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

## Summary

**DO NOT USE THIS APPLICATION WITH REAL PATIENT DATA** until all Phase 1 and Phase 2 items are implemented and tested by security professionals.

**Current Demo Safety**: ✅ Safe for portfolio/demo with test data only  
**Production Safety**: ❌ NOT READY - Multiple critical vulnerabilities

Last Updated: 2026-09-22

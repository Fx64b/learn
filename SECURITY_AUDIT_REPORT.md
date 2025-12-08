# Security Audit Report - Learn Application

**Date**: 2025-11-29
**Auditor**: Security Analysis
**Application**: Learn - Flashcard Learning Platform
**Version**: 1.14.0
**Stack**: Next.js 15, TypeScript, Stripe, Google AI

---

## Executive Summary

This comprehensive security audit examined the Learn flashcard application across all critical security domains including authentication, payment processing, file uploads, API endpoints, and data protection. The application demonstrates **strong security practices overall** with proper authentication, payment integration, and input validation.

**Overall Risk Level: LOW-MEDIUM**

- ✅ **Strengths**: Robust authentication, excellent Stripe integration security, proper SQL injection prevention, comprehensive rate limiting, secure PDF processing
- ⚠️ **Areas for Improvement**: CSP policy weakening, CORS configuration, error message verbosity, dependency updates

---

## Findings Summary

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 0 | None Found |
| 🟠 High | 2 | Requires Attention |
| 🟡 Medium | 7 | Should Fix |
| 🟢 Low | 8 | Optional Improvement |
| ℹ️ Info | 5 | Recommendations |

---

## Detailed Findings

### 🔴 CRITICAL PRIORITY

**No critical vulnerabilities found.** The application has no immediate security risks that require emergency patching.

---

### 🟠 HIGH PRIORITY

#### H-1: Weak Content Security Policy (CSP)

**Location**: `middleware/security.ts:14`

**Issue**:
```typescript
'Content-Security-Policy',
"default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
```

The CSP includes `unsafe-eval` and `unsafe-inline` which significantly weakens XSS protection. These directives allow:
- Arbitrary JavaScript execution via `eval()`
- Inline scripts and event handlers
- Inline styles

**Risk**:
- If an XSS vulnerability exists elsewhere, attackers can execute arbitrary JavaScript
- Reduces defense-in-depth against injection attacks

**Recommendation**:
```typescript
// Use nonces or hashes instead
const nonce = crypto.randomUUID()
response.headers.set(
  'Content-Security-Policy',
  `default-src 'self';
   img-src 'self' data: https:;
   script-src 'self' 'nonce-${nonce}';
   style-src 'self' 'nonce-${nonce}';
   object-src 'none';
   base-uri 'self';
   form-action 'self';`
)
```

Then add nonce to script/style tags:
```tsx
<script nonce={nonce}>...</script>
```

**Impact**: High
**Effort**: Medium (requires refactoring inline scripts)

---

#### H-2: Cron Job Authentication Uses Weak Secret Comparison

**Location**: `app/api/cron/payment-recovery/route.ts:14`

**Issue**:
```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

This uses standard string comparison which is vulnerable to timing attacks. An attacker could use timing analysis to determine the secret character by character.

**Risk**:
- Timing attack could reveal CRON_SECRET
- Unauthorized payment recovery emails could be triggered
- Potential for spam or information disclosure

**Recommendation**:
```typescript
import { timingSafeEqual } from 'crypto'

function compareSecrets(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    return timingSafeEqual(bufA, bufB)
}

const authHeader = request.headers.get('authorization')
const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
if (!authHeader || !compareSecrets(authHeader, expectedAuth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Impact**: High
**Effort**: Low (simple fix)

---

### 🟡 MEDIUM PRIORITY

#### M-1: CORS Headers Too Permissive in SSE Endpoint

**Location**: `app/api/ai-flashcards/route.ts:172`

**Issue**:
```typescript
'Access-Control-Allow-Origin': '*',
```

The AI flashcards SSE endpoint allows requests from any origin. While the endpoint requires authentication, this still exposes it to potential CSRF attacks from authenticated users on malicious sites.

**Risk**:
- Authenticated users could be tricked into making AI requests from malicious websites
- Potential for unauthorized AI usage burning through user quotas

**Recommendation**:
```typescript
// Replace wildcard with actual domain
'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'https://learn.fx64b.dev',
'Access-Control-Allow-Credentials': 'true',
```

Or better yet, remove CORS headers entirely for same-origin requests.

**Impact**: Medium
**Effort**: Low

---

#### M-2: Input Sanitization Could Be More Robust

**Location**: `app/actions/ai-flashcards.ts:83-93`

**Issue**:
```typescript
function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>'"]/g, '')
        .replace(/javascript:|data:|vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
        .substring(0, MAX_PROMPT_LENGTH)
}
```

This sanitization removes potentially dangerous characters but:
- Doesn't handle encoded characters (`%3Cscript%3E`)
- Regex-based sanitization can be bypassed with creative encoding
- May break legitimate user input (quotes in text)

**Risk**:
- Potential for XSS if sanitized content is rendered as HTML
- User experience issues with legitimate inputs

**Recommendation**:
Use a proper HTML sanitization library or rely on React's built-in XSS protection (which you already have). Since React escapes by default, you can simplify:

```typescript
function sanitizeInput(input: string): string {
    // Just validate length and remove control characters
    // Let React handle escaping on render
    return input
        .trim()
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
        .substring(0, MAX_PROMPT_LENGTH)
}
```

**Impact**: Medium
**Effort**: Low

---

#### M-3: Error Messages May Leak Internal Information

**Location**: `lib/subscription/stripe/secure-error-handling.ts` (used throughout)

**Issue**:
While the application has good error handling infrastructure, some endpoints still log detailed errors:

```typescript
console.error('Webhook processing failed:', error)
```

In production, detailed error messages could leak:
- Stack traces
- Database structure
- Internal file paths
- API keys (if accidentally logged)

**Risk**:
- Information disclosure to attackers
- Potential exposure of sensitive configuration details

**Recommendation**:
1. Ensure production logging redacts sensitive information
2. Use structured logging with severity levels
3. Implement log scrubbing for secrets

```typescript
// Add to error logging
function sanitizeErrorForLogging(error: unknown) {
    if (error instanceof Error) {
        return {
            message: error.message,
            // Don't include stack in production
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    }
    return { message: 'Unknown error' }
}
```

**Impact**: Medium
**Effort**: Medium

---

#### M-4: Rate Limiting Gracefully Degrades When Redis Unavailable

**Location**: `lib/rate-limit/rate-limit.ts:91-97`

**Issue**:
```typescript
if (!ratelimit) {
    return {
        success: true,  // Always succeeds if Redis is unavailable
        ...
    }
}
```

When Redis is not configured or unavailable, rate limiting is completely disabled. This could lead to:
- Abuse during Redis outages
- Developers forgetting to configure Redis in production

**Risk**:
- Resource exhaustion during Redis downtime
- Potential for abuse of AI features
- Email bombing during authentication

**Recommendation**:
Implement in-memory fallback rate limiting:

```typescript
import { LRUCache } from 'lru-cache'

const memoryRateLimits = new LRUCache<string, { count: number; reset: number }>({
    max: 500,
    ttl: 60 * 60 * 1000, // 1 hour
})

export async function checkRateLimit(identifier: string, type: keyof typeof limits = 'general') {
    const ratelimit = limits[type]

    if (!ratelimit) {
        // Fallback to in-memory rate limiting
        console.warn('Redis unavailable, using in-memory rate limiting')
        return checkMemoryRateLimit(identifier, type)
    }

    return await ratelimit.limit(identifier)
}
```

**Impact**: Medium
**Effort**: Medium

---

#### M-5: Session Token Not Explicitly Validated for NEXTAUTH_SECRET

**Location**: `middleware.ts:17`

**Issue**:
```typescript
const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
```

If `NEXTAUTH_SECRET` is not set or changes, sessions become invalid but there's no explicit check or error handling. This could lead to:
- Silent authentication failures
- Confusing user experience
- Security issues if secret is weak or default

**Risk**:
- Users mysteriously logged out
- Potential for session forging if secret is weak

**Recommendation**:
Add startup validation:

```typescript
// In a config validation file
function validateCriticalEnvVars() {
    const required = ['NEXTAUTH_SECRET', 'DATABASE_URL', 'NEXTAUTH_URL']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
        throw new Error(`Missing critical environment variables: ${missing.join(', ')}`)
    }

    // Validate NEXTAUTH_SECRET strength
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
        console.warn('⚠️ NEXTAUTH_SECRET should be at least 32 characters')
    }
}
```

**Impact**: Medium
**Effort**: Low

---

#### M-6: Stripe Webhook IP Validation Allows All Traffic

**Location**: `lib/subscription/stripe/stripe-webhook-security.ts:69`

**Issue**:
```typescript
return {
    isValid: true, // Always true - let signature verification be the gate
    ...
}
```

The webhook IP validation always returns true, even for suspicious IPs. While signature verification is the primary security mechanism, this reduces defense-in-depth.

**Risk**:
- Relies solely on signature verification
- No protection against replay attacks from non-Stripe IPs
- Increased attack surface

**Recommendation**:
Implement tiered validation:

```typescript
export function validateStripeWebhookSource(request: NextRequest): WebhookSecurityResult {
    const clientIP = getClientIP(request)

    // In production, be stricter about IP validation
    if (process.env.NODE_ENV === 'production' && clientIP !== 'unknown') {
        if (!STRIPE_WEBHOOK_IPS.includes(clientIP)) {
            // Log and reject in production
            logWebhookSecurityEvent('blocked', { ... })
            return {
                isValid: false,
                reason: `Webhook from non-Stripe IP: ${clientIP}`,
                ...
            }
        }
    }

    return { isValid: true, ... }
}
```

**Impact**: Medium
**Effort**: Low

---

#### M-7: No Request ID Correlation Between Client and Server

**Location**: Multiple API routes

**Issue**:
Request IDs are generated server-side but not validated or correlated with client requests. This makes it harder to trace malicious requests or debug issues.

**Risk**:
- Difficult to trace attack patterns
- Harder to correlate client-side and server-side logs
- Limited audit trail

**Recommendation**:
Implement request ID forwarding:

```typescript
// In middleware
const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
response.headers.set('x-request-id', requestId)

// Pass to all downstream handlers
```

**Impact**: Low-Medium
**Effort**: Medium

---

### 🟢 LOW PRIORITY

#### L-1: Dependency Vulnerabilities Detected

**Location**: `package.json`

**Issue**:
Pnpm audit shows several vulnerabilities:
- `js-yaml` in `@eslint/eslintrc` (ID: 1109802)
- `nodemailer` in `@auth/drizzle-adapter` (ID: 1109804)
- `glob` in test dependencies (ID: 1109842)

Most are in dev dependencies and pose minimal risk to production.

**Risk**:
- Supply chain attacks (low probability)
- Dev environment compromise

**Recommendation**:
```bash
pnpm update js-yaml glob
pnpm audit fix
```

Review `@auth/drizzle-adapter` for updates.

**Impact**: Low
**Effort**: Low

---

#### L-2: Missing Security Headers

**Location**: `middleware/security.ts`

**Issue**:
Some recommended security headers are missing:
- `X-DNS-Prefetch-Control`
- `X-Download-Options`
- `X-Permitted-Cross-Domain-Policies`

**Risk**: Minimal - these are defense-in-depth headers

**Recommendation**:
```typescript
response.headers.set('X-DNS-Prefetch-Control', 'off')
response.headers.set('X-Download-Options', 'noopen')
response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
```

**Impact**: Low
**Effort**: Low

---

#### L-3: PDF Parsing Timeout Could Be Lowered

**Location**: `app/actions/ai-flashcards.ts:22`

**Issue**:
```typescript
const PDF_PARSING_TIMEOUT = 30000 // 30 seconds
```

30 seconds is generous for PDF parsing. This could allow slow-parsing attacks to tie up resources.

**Risk**:
- Resource exhaustion with many slow PDFs
- Denial of service

**Recommendation**:
```typescript
const PDF_PARSING_TIMEOUT = 15000 // 15 seconds
```

15 seconds should be sufficient for legitimate PDFs under 5MB.

**Impact**: Low
**Effort**: Low

---

#### L-4: Server Actions Missing CSRF Protection

**Location**: Server actions in `/app/actions/`

**Issue**:
Next.js server actions don't have explicit CSRF tokens. While Next.js 15 has built-in CSRF protection for server actions, it's not explicitly documented in the code.

**Risk**:
- Potential CSRF if Next.js protection is bypassed
- Lack of explicit documentation

**Recommendation**:
Add comment documentation:

```typescript
// Server actions are protected by Next.js built-in CSRF protection
// via the Origin header check and POST-only requirement
export async function createDeck(formData: FormData) {
    // ...
}
```

Or implement explicit CSRF tokens for defense-in-depth.

**Impact**: Low
**Effort**: Low

---

#### L-5: Email Rate Limiting Could Be More Granular

**Location**: `lib/rate-limit/rate-limit.ts:15`

**Issue**:
```typescript
email: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, '15m'),
}),
```

5 emails per 15 minutes is good, but there's no daily limit. An attacker could send 480 emails per day (5 * 4 * 24).

**Risk**:
- Email bombing over extended period
- Potential abuse of email service

**Recommendation**:
Add secondary daily limit:

```typescript
emailDaily: new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(20, '24h'),
}),
```

**Impact**: Low
**Effort**: Low

---

#### L-6: No Subresource Integrity (SRI) for External Resources

**Location**: HTML/JSX files loading external resources

**Issue**:
If you load any external scripts/styles (CDNs), they don't use SRI hashes.

**Risk**:
- Compromised CDN could inject malicious code
- Man-in-the-middle attacks

**Recommendation**:
If using CDNs, add SRI hashes:

```tsx
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossOrigin="anonymous"
/>
```

**Impact**: Low
**Effort**: Low

---

#### L-7: Database Connection String in Environment Variable

**Location**: `.env.local.example:1`

**Issue**:
```env
DATABASE_URL=""
DATABASE_AUTH_TOKEN=""
```

Database credentials in environment variables are standard but could be more secure.

**Risk**:
- Credentials exposed if environment is compromised
- Logged in error messages

**Recommendation**:
- Use managed secrets (AWS Secrets Manager, Vercel env vars)
- Ensure `.env.local` is in `.gitignore` (already done)
- Rotate DATABASE_AUTH_TOKEN regularly

**Impact**: Low
**Effort**: Medium

---

#### L-8: No Rate Limiting on Successful Login

**Location**: `lib/auth.ts`

**Issue**:
Rate limiting exists for email sending, but not for successful logins. This could allow:
- Account enumeration (checking which emails exist)
- Credential stuffing attacks

**Risk**:
- Account enumeration
- Automated attacks

**Recommendation**:
Add rate limiting to successful authentication:

```typescript
callbacks: {
    async signIn({ user, account, profile }) {
        const result = await checkRateLimit(`login-success:${user.email}`, 'general')
        if (!result.success) {
            return false
        }
        return true
    }
}
```

**Impact**: Low
**Effort**: Medium

---

### ℹ️ INFORMATIONAL / RECOMMENDATIONS

#### I-1: Security Monitoring and Logging

**Recommendation**: Implement centralized security event logging

Consider adding:
- Structured logging with severity levels
- Security event aggregation (failed logins, rate limits, suspicious IPs)
- Alerting for security events
- Log retention policy

Example:
```typescript
import pino from 'pino'

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: ['password', 'token', 'apiKey'],
})

logger.warn({ event: 'rate_limit_exceeded', userId, ip }, 'User exceeded rate limit')
```

---

#### I-2: Implement Security.txt

**Recommendation**: Add `/.well-known/security.txt` for responsible disclosure

```
Contact: mailto:security@fx64b.dev
Expires: 2026-12-31T23:59:59.000Z
Preferred-Languages: en, de
```

---

#### I-3: Regular Security Audits

**Recommendation**: Schedule periodic security reviews

- Quarterly dependency audits
- Annual penetration testing
- Code security scanning in CI/CD
- OWASP ZAP automated scanning

---

#### I-4: Implement Content Security Policy Reporting

**Recommendation**: Add CSP reporting to detect violations

```typescript
Content-Security-Policy: ...; report-uri /api/csp-report
```

This helps identify:
- Potential XSS attempts
- Misconfigured resources
- Browser extensions interfering

---

#### I-5: Consider Implementing MFA for Pro Users

**Recommendation**: Add two-factor authentication for premium accounts

Since you handle payments, consider:
- TOTP-based 2FA
- Email-based verification codes
- SMS verification (optional)

This adds significant security for accounts with payment information.

---

## Security Strengths

The application demonstrates excellent security practices in several areas:

### ✅ Authentication & Authorization
- **JWT-based authentication** with secure session handling
- **Proper session validation** in middleware (`middleware.ts:17`)
- **Role-based access control** for protected routes
- **Rate limiting** on authentication endpoints (`lib/auth.ts:34-41`)

### ✅ Payment Processing (Stripe)
- **Webhook signature verification** (`app/api/stripe/webhook/route.ts:106-120`)
- **Idempotency protection** (`app/api/stripe/create-checkout-session/route.ts:298`)
- **Comprehensive error handling** with secure error responses
- **Payment recovery system** with grace periods
- **IP validation** (though permissive) with logging
- **Transaction atomicity** for database operations

### ✅ Database Security
- **Drizzle ORM** prevents SQL injection through parameterized queries
- **Proper indexing** on sensitive columns (user_id, deck_id)
- **Foreign key constraints** maintain referential integrity
- **No raw SQL queries** in application code

### ✅ File Upload Security (PDF)
- **Magic byte validation** (`app/actions/ai-flashcards.ts:109-114`)
- **File size limits** (5MB maximum)
- **Parsing timeout protection** (30 seconds)
- **MIME type validation**
- **Content sanitization** after extraction

### ✅ Input Validation & Sanitization
- **Zod schemas** for all API inputs
- **Input sanitization** for user content
- **Length restrictions** on all text fields
- **AI response validation** for dangerous patterns (`app/actions/ai-flashcards.ts:235-278`)

### ✅ Rate Limiting
- **Comprehensive rate limiting** across all critical endpoints
- **Tiered limits** by operation type
- **IP-based and user-based** limiting
- **Sliding window algorithm** prevents burst attacks

### ✅ API Security
- **Authentication required** for all sensitive endpoints
- **Request validation** with Zod schemas
- **Error handling** with secure responses
- **Logging** of security events

---

## Testing Performed

### Manual Code Review
- ✅ All authentication flows
- ✅ Payment processing logic
- ✅ File upload handling
- ✅ API endpoint security
- ✅ Database queries
- ✅ Environment variable usage
- ✅ Middleware configuration

### Static Analysis
- ✅ Dependency vulnerability scanning (`pnpm audit`)
- ✅ TypeScript strict mode enabled
- ✅ ESLint security rules
- ✅ Code pattern analysis

### Configuration Review
- ✅ Next.js security headers
- ✅ CSP configuration
- ✅ CORS settings
- ✅ Rate limiting configuration
- ✅ Database schema

---

## Remediation Priority & Timeline

### Immediate (Within 1 Week)
1. **H-2**: Fix cron job timing attack vulnerability
2. **M-1**: Remove wildcard CORS headers
3. **M-5**: Add NEXTAUTH_SECRET validation

### Short Term (Within 1 Month)
1. **H-1**: Strengthen CSP policy (requires refactoring)
2. **M-2**: Improve input sanitization
3. **M-4**: Implement in-memory rate limiting fallback
4. **M-6**: Strengthen Stripe webhook IP validation
5. **L-1**: Update vulnerable dependencies

### Medium Term (Within 3 Months)
1. **M-3**: Implement secure logging infrastructure
2. **M-7**: Add request ID correlation
3. **L-4**: Document CSRF protection
4. **L-8**: Add login rate limiting
5. **I-1**: Implement security monitoring

### Long Term (Within 6 Months)
1. **I-5**: Implement MFA for Pro users
2. **I-3**: Establish security audit schedule
3. **I-4**: Add CSP reporting

---

## Compliance Notes

### GDPR Considerations
- ✅ User data stored securely
- ✅ Email-only authentication (minimal PII)
- ⚠️ Need privacy policy documentation
- ⚠️ Need data retention policy
- ⚠️ Need data export/deletion mechanism

### PCI DSS
- ✅ No card data stored locally (Stripe handles)
- ✅ Stripe webhook signature verification
- ✅ Secure transmission (HTTPS enforced)

### OWASP Top 10 (2021)
- ✅ A01: Broken Access Control - **Protected**
- ✅ A02: Cryptographic Failures - **Protected**
- ✅ A03: Injection - **Protected** (ORM usage)
- ⚠️ A04: Insecure Design - **Mostly protected** (CSP weakness)
- ✅ A05: Security Misconfiguration - **Protected**
- ✅ A06: Vulnerable Components - **Minor issues**
- ✅ A07: Auth Failures - **Protected**
- ✅ A08: Data Integrity Failures - **Protected**
- ⚠️ A09: Security Logging Failures - **Could improve**
- ✅ A10: SSRF - **Not applicable**

---

## Conclusion

The Learn application demonstrates **strong security fundamentals** with excellent authentication, payment processing, and input validation. The codebase follows modern security best practices and uses well-vetted libraries.

### Key Recommendations:
1. **Strengthen CSP** to remove unsafe-inline and unsafe-eval
2. **Fix timing attack** in cron authentication
3. **Remove wildcard CORS** headers
4. **Implement security monitoring** and alerting
5. **Regular dependency updates** and security audits

### Risk Assessment:
**Overall Risk: LOW-MEDIUM**

The application is **safe to publish** with the current security posture, but addressing the High priority findings before launch is recommended.

### Sign-Off

This audit found **no critical vulnerabilities** that would prevent publication. The identified issues are manageable and can be addressed through normal development cycles. The development team has demonstrated security awareness and best practices throughout the codebase.

**Recommendation**: ✅ **APPROVED FOR PUBLICATION** with plan to address High priority findings within 1 week.

---

## Appendix A: Security Checklist

- [x] Authentication implemented correctly
- [x] Authorization checks on all protected routes
- [x] SQL injection prevention
- [x] XSS protection (with CSP improvements needed)
- [x] CSRF protection via Next.js
- [x] Rate limiting implemented
- [x] Secure session management
- [x] Input validation and sanitization
- [x] File upload security
- [x] Payment processing security
- [x] Error handling without information leakage (mostly)
- [x] Security headers configured
- [x] HTTPS enforced (in production)
- [ ] CSP without unsafe directives (needs work)
- [x] Secrets management
- [ ] Security monitoring (recommended)
- [ ] Regular security audits (recommended)

---

## Appendix B: References

- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

---

**End of Report**

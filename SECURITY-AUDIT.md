# Security Audit Report

**Date:** 2026-03-11
**Scope:** NWHub (`/nwhub`) + Northern Warrior public site (`/northernwarrior-v2`)
**Auditor:** Claude Code (automated)

---

## Summary

| Category | Status | Issues Found | Issues Fixed |
|---|---|---|---|
| 1. Hardcoded secrets | ✅ Clean | 0 | 0 |
| 2. .gitignore | ✅ Clean | 0 | 0 |
| 3. Supabase RLS | ⚠️ → ✅ Fixed | 10 tables missing RLS | New migration created |
| 4. API route protection | ⚠️ → ✅ Fixed | Middleware returning 302 for API routes; 6 high-risk routes unprotected | Fixed middleware + added auth guards |
| 5. Middleware | ⚠️ → ✅ Fixed | API routes got redirect instead of 401; 2 public routes not exempted | Updated |
| 6. Rate limiting | ⚠️ → ✅ Fixed | No rate limiting anywhere | Added to 6 endpoints |
| 7. Security headers | ⚠️ → ✅ Fixed | No headers in NWHub; minimal in northernwarrior-v2 | Added to both |
| 8. Debug endpoints | 🔴 → ✅ Fixed | Live `/api/mongo-test` on public site | Deleted |

---

## 1. Environment Variable Audit

**Result: No hardcoded secrets found.**

All credentials in both projects correctly use `process.env.*`:

| Project | Variables used |
|---|---|
| nwhub | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `MAILCHIMP_API_KEY`, `ANTHROPIC_API_KEY` |
| northernwarrior-v2 | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_ADMIN_TO`, `MONGODB_URI`, `ANTHROPIC_API_KEY` |

> **Note:** `supabase/migrations/20260306000000_review_cron.sql` contains `<PROJECT_REF>` and `<ANON_KEY>` — these are literal template placeholders (angle-bracket syntax), not real secrets. They must be replaced manually before running the migration.

---

## 2. .gitignore Audit

**Result: Both projects already covered.**

Both `.gitignore` files contain `.env*` which is a wildcard covering:
- `.env`
- `.env.local`
- `.env.production`
- `.env*.local`
- Any other `.env` variant

No changes needed.

---

## 3. Supabase Row Level Security (RLS)

### Tables already hardened (pre-audit)
| Table | RLS | Policies |
|---|---|---|
| `page_content` | ✅ Enabled | Public SELECT |
| `page_views` | ✅ Enabled | Anon INSERT, authenticated SELECT |

### Tables fixed by this audit

Migration file: `supabase/migrations/20260311000001_rls_hardening.sql`

| Table | Fix applied |
|---|---|
| `page_content` | Added authenticated write policy (was missing) |
| `chat_sessions` | Enabled RLS; anon INSERT, authenticated SELECT/UPDATE |
| `contacts` | Enabled RLS; authenticated only (PII — admin only) |
| `blog_posts` | Enabled RLS; anon SELECT on `published` only; authenticated full access |
| `review_requests` | Enabled RLS; authenticated only |
| `global_settings` | Enabled RLS; authenticated only (contains API keys) |
| `email_subscribers` | Enabled RLS; anon INSERT (website subscribe); authenticated full access |
| `email_campaigns` | Enabled RLS; authenticated only |
| `sms_subscribers` | Enabled RLS; authenticated only (phone numbers — PII) |
| `sms_campaigns` | Enabled RLS; authenticated only |
| `media` | Enabled RLS; authenticated only |
| `contact_enquiries` | Enabled RLS; anon INSERT (public form); authenticated SELECT |

> **Action required:** Run `supabase db push` to apply this migration.

---

## 4. API Route Protection

### Architecture note

NWHub uses two layers of protection:
1. **Middleware** (`src/middleware.ts`) — blocks all unauthenticated requests at the edge before routes run
2. **In-route `requireAuth()`** — added to the highest-risk routes as defence-in-depth

All routes using `createAdminClient()` (service-role key) are protected by the middleware. The 6 routes below were additionally hardened with explicit in-route session checks.

### Routes given explicit `requireAuth()` guards

| Route | Method | Reason |
|---|---|---|
| `/api/settings` | POST | Writes global settings including API keys |
| `/api/chat/settings` | GET, POST | Reads/writes AI API key |
| `/api/email/send-campaign` | POST | Triggers bulk email to all subscribers |
| `/api/sms/send-campaign` | POST | Triggers bulk SMS/WhatsApp to all subscribers |
| `/api/mailchimp/send` | POST | Triggers Mailchimp campaign send |
| `/api/reviews/run` | POST | Triggers WhatsApp messages to all contacts |
| `/api/media` | POST, DELETE | Unrestricted file upload/delete |

### Routes that are intentionally public (no auth)

| Route | Reason |
|---|---|
| `/api/chat` (NWHub) | Public chat widget on website |
| `/api/chat` (northernwarrior-v2) | Public chat widget |
| `/api/analytics/track` | Beacon from public site (anon) |
| `/api/email/unsubscribe` | Token-based unsubscribe link in emails |
| `/api/email/subscribe` (northernwarrior-v2) | Website email signup form |
| `/api/contact` (northernwarrior-v2) | Public contact form |
| `/api/kids/calendar` | ICS calendar download |
| `/api/kids/register` | Kids registration form |

### Auth helper created

`src/lib/auth-guard.ts` — uses `supabase.auth.getUser()` (server-side JWT validation) not `getSession()` (which trusts the client-provided JWT and can be spoofed).

---

## 5. Middleware Protection

### NWHub (`src/middleware.ts`)

**Bugs fixed:**
- API routes were receiving `302 → /login` redirect instead of `401 JSON`. Fetch calls can't follow auth redirects — this would cause silent failures in the admin UI.
- `/api/analytics/track` and `/api/email/unsubscribe` were missing from the public API allowlist, causing them to redirect unauthenticated callers.

**After fix:**
- Unauthenticated page requests → `302 /login` (correct for browser navigation)
- Unauthenticated API requests → `401 { error: 'Unauthorised' }` (correct for fetch consumers)
- Uses `getUser()` not `getSession()` (already correct)

### northernwarrior-v2

No middleware needed — it's a public website. All API routes are intentionally public-facing. Rate limiting (step 6) protects against abuse.

---

## 6. Rate Limiting

**Helper created:** `src/lib/rate-limit.ts` (NWHub) and `src/lib/rate-limit.ts` (northernwarrior-v2)

Uses an in-memory sliding-window counter. Keyed by `endpoint:ip`.

| Route | Limit | Window | Reason |
|---|---|---|---|
| `nwhub /api/chat` | 20 req | 1 min | Public AI endpoint — prevents Claude API cost abuse |
| `nwhub /api/email/send-campaign` | 5 req | 1 hour | Prevents accidental bulk email spam loops |
| `nwhub /api/sms/send-campaign` | 5 req | 1 hour | Prevents Twilio cost abuse |
| `nwhub /api/mailchimp/send` | 5 req | 1 hour | Prevents Mailchimp send abuse |
| `nw-v2 /api/chat` | 20 req | 1 min | Public AI endpoint |
| `nw-v2 /api/contact` | 5 req | 1 hour | Prevents contact form spam |
| `nw-v2 /api/email/subscribe` | 10 req | 1 hour | Prevents subscriber list pollution |

> **Production note:** The in-memory store is per-process and resets on deploy. For multi-instance production (Vercel serverless), replace with [@upstash/ratelimit](https://github.com/upstash/ratelimit-js) backed by Upstash Redis — this is a drop-in replacement using the same `rateLimit()` interface.

---

## 7. Security Headers

### NWHub (`next.config.ts`)

Added to all routes (`source: "/(.*)"`) :

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Admin panel must never be embeddable in an iframe |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |
| `X-DNS-Prefetch-Control` | `on` | Performance (safe) |

### northernwarrior-v2 (`next.config.ts`)

Added (excluding `X-Frame-Options DENY` — site must be embeddable in NWHub's visual editor):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `frame-ancestors 'self' http://localhost:3000` (pre-existing, supersedes X-Frame-Options in modern browsers) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## 8. Debug Endpoint Removed

**`northernwarrior-v2 /api/mongo-test`** — deleted.

This route was a live endpoint that pinged the MongoDB instance and exposed connection error messages to unauthenticated callers. Removing it also removes the MongoDB dependency from the public request path. `src/lib/mongodb.ts` remains but is no longer reachable via HTTP.

---

## Remaining Manual Actions Required

These items require manual steps that cannot be automated:

### High priority

1. **Apply RLS migration** — run `supabase db push` from the `nwhub` directory to apply `20260311000001_rls_hardening.sql`

2. **Replace cron SQL placeholders** — `supabase/migrations/20260306000000_review_cron.sql` contains `<PROJECT_REF>` and `<ANON_KEY>`. Replace with real values before pushing. Consider using `SUPABASE_SERVICE_ROLE_KEY` instead of anon key for cron functions for tighter security.

3. **Update `NEXT_PUBLIC_SITE_URL`** — set this env var in NWHub production to your real Northern Warrior site URL so the "View Live Site" button works correctly.

4. **Twilio webhook verification** — `/api/reviews/webhook` receives POST requests from Twilio with no signature verification. Twilio provides `X-Twilio-Signature` header that should be validated using `twilio.validateRequest()`. This prevents spoofed webhook calls. Manual implementation required.

5. **Supabase Storage bucket policy** — the `media` bucket in Supabase Storage should have its bucket-level policy reviewed in the Supabase dashboard. Ensure it is not set to "public" with unrestricted upload — only authenticated users should upload.

### Medium priority

6. **Production rate limiting** — replace the in-memory rate limiter with Upstash Redis (`@upstash/ratelimit`) before going to multi-instance production. The interface is identical — only the import changes.

7. **Content-Security-Policy (full)** — the current CSP only covers `frame-ancestors`. A full CSP (`default-src`, `script-src`, `style-src`, etc.) would provide XSS protection. Requires careful tuning to not break Next.js — recommend using [next-safe](https://github.com/nicholasgasior/next-safe) or manual configuration after thorough testing.

8. **Strict-Transport-Security** — add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` once HTTPS is confirmed stable on production domains.

9. **Remove MongoDB dependency** — if MongoDB is no longer in use, remove `mongodb` from `northernwarrior-v2/package.json` and delete `src/lib/mongodb.ts` to reduce attack surface.

10. **Review `kids/register` endpoint** — this endpoint collects children's data (names, DOB, medical info) and sends it via email. Consider storing it in Supabase with RLS rather than relying solely on email delivery.

---

## Files Changed

### NWHub
| File | Change |
|---|---|
| `src/middleware.ts` | Return 401 JSON for API routes; add analytics/track + email/unsubscribe to public allowlist |
| `src/lib/auth-guard.ts` | **New** — `requireAuth()` helper using `getUser()` |
| `src/lib/rate-limit.ts` | **New** — in-memory sliding-window rate limiter |
| `src/app/api/settings/route.ts` | Added `requireAuth()` |
| `src/app/api/chat/settings/route.ts` | Added `requireAuth()` on GET and POST |
| `src/app/api/chat/route.ts` | Added rate limiting (20 req/min) |
| `src/app/api/email/send-campaign/route.ts` | Added `requireAuth()` + rate limit (5/hr) |
| `src/app/api/sms/send-campaign/route.ts` | Added `requireAuth()` + rate limit (5/hr) |
| `src/app/api/mailchimp/send/route.ts` | Added `requireAuth()` + rate limit (5/hr) |
| `src/app/api/reviews/run/route.ts` | Added `requireAuth()` |
| `src/app/api/media/route.ts` | Added `requireAuth()` on POST and DELETE |
| `next.config.ts` | Added security headers |
| `supabase/migrations/20260311000001_rls_hardening.sql` | **New** — RLS for 12 tables |

### northernwarrior-v2
| File | Change |
|---|---|
| `src/lib/rate-limit.ts` | **New** — same rate limiter |
| `src/app/api/chat/route.ts` | Added rate limiting (20 req/min) |
| `src/app/api/contact/route.ts` | Added rate limiting (5/hr) |
| `src/app/api/email/subscribe/route.ts` | Added rate limiting (10/hr) |
| `src/app/api/mongo-test/route.ts` | **Deleted** — live debug endpoint |
| `next.config.ts` | Added security headers |

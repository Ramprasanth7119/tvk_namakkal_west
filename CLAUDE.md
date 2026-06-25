@AGENTS.md

# CLAUDE.md — TVK Namakkal West

Operating rules + verified project context for this repository. Loaded into context every session — keep it accurate and tight. Everything below was **verified against the code** (Jun 2026), not taken from the README on trust; where the repo's own `README.md` disagrees, this file is correct.

> ⚠️ **This is Next.js 16 — newer than the model's training data.** The imported `AGENTS.md` rule stands: APIs, conventions, and file structure differ from older Next.js. When unsure, read the installed docs in `node_modules/next/dist/docs/` (run `npm install` first if `node_modules` is absent) and heed deprecation notices. Do not assume Next.js 13/14/15 behavior.

---

## 1. What this app is

A **citizen grievance (complaint) platform** for the TVK party in the Namakkal West region of Tamil Nadu. Citizens submit complaints (voter-verified, with geolocation + photo/video evidence); party staff resolve them through a multi-role approval chain; the public can track a complaint by ID and view analytics. **Bilingual UI — Tamil-first, English in parentheses.** Real production data — treat changes with care.

**Three roles** (`constants/roles.ts`): `SUPER_ADMIN`, `REPRESENTATIVE`, `FIELD_OFFICER`.

**Complaint lifecycle** (the core domain): a complaint is submitted → assigned to a field officer → worked → solution submitted → representative approves → admin approves → resolved (rejections loop back to "work in progress"). Details in [§7](#7-domain-data-model).

---

## 2. Tech Stack (authoritative — from `package.json`)

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js | **16.2.9** | App Router only. No `pages/`. |
| UI runtime | React | **19.2.4** | Server Components by default. |
| Language | TypeScript | ^5 | `strict: true` (but `app/page.tsx` has `// @ts-nocheck`). |
| Styling | Tailwind CSS | **v4** | `app/globals.css` + a large `app/home.css`. |
| Database | MongoDB driver | **7.3.0** | **No ORM** — raw driver via `@/lib/mongodb`. |
| Media | Cloudinary | ^2.10 | uploads via `@/lib/cloudinary`. |
| Charts | recharts | ^3.8 | analytics UI only. |
| Spreadsheets | xlsx | ^0.18 | voter-registry import/export. |

**No Zod, no ORM, no auth library, no state library.** Sessions, hashing, validation, rate limiting, and security are **hand-rolled** in `lib/` + `validators/`. Match those patterns; don't add dependencies without asking.

---

## 3. Next.js 16 — Critical Rules

1. **Async request APIs.** `params`, `searchParams`, `cookies()`, `headers()` are **Promises** — `await` them. The repo already does (`const cookieStore = await cookies()`). Never destructure them synchronously.
2. **Server Components by default.** Files in `app/` are Server Components unless they start with `"use client"`. Note: in practice **every page route here is `"use client"`** (see §8). Add `"use client"` only for interactivity/hooks/browser APIs.
3. **`error.tsx` must be a Client Component.** `layout/page/loading/not-found` can be server.
4. **Middleware → `proxy.ts`.** Next 16 renamed Middleware to `proxy.ts`. This repo still uses **`middleware.ts`** — works but on the deprecation path. Don't rename casually; check the deprecation notice in installed docs before touching it.
5. **Caching is explicit** — don't assume fetch results cache.

---

## 4. Actual Architecture (⚠️ NOT what the folder names imply)

The repo once had `services/`/`hooks/`/`validators/` dirs implying a `page → hook → service → api` flow, but they were dead code (imported by nothing) and were **deleted (2026-06-21)**. **The real runtime flow is simpler:**

**Real data flow (this is the established pattern — follow it):**
```
Client page ("use client")  ──►  inline  fetch("/api/...")  ──►  app/api/**/route.ts
   (app/*/page.tsx)                                                 │  business logic lives INLINE here
                                                                    ▼
                                                          lib/*.ts helpers  ──►  MongoDB (getDb())
```
- **Pages call `/api/...` directly with inline `fetch`** (~41 such calls across `app/`).
- **Route handlers (`route.ts`) contain the business logic inline** (auth, validation, the complaint state machine, Mongo queries), delegating only to `lib/` helpers.

**Guidance:** when adding client→server data flow, **follow the established inline-`fetch`-in-page + logic-in-`route.ts` pattern**. Validate inline (in the form) and again in the route handler (via `lib/security.ts` helpers). Don't recreate a `services/`/`hooks/`/`validators/` layer unless you're deliberately introducing one and wiring it everywhere — raise that as an explicit refactor.

**Path alias:** `@/*` → repo root (`@/lib/mongodb`, `@/constants/roles`). Always import via `@/…`.

---

## 5. Folder Map

```
app/                      # App Router — routing + the real backend (route handlers)
  page.tsx                # home page — 2,214-line "use client" mega-component, // @ts-nocheck. Contains the 5-step complaint modal.
  layout.tsx  globals.css  home.css
  login/ track/ analytics/ complaints/ my-tasks/ admin/   # page routes (all "use client", all COMPLETE)
  api/**/route.ts         # the actual backend — inline business logic + lib/ helpers
components/               # shared UI (admin/, analytics/ Recharts widgets, TvkTopBar, TvkHomeNav, TvkAppFooter, WhistleCursor)
lib/                      # INFRA + business helpers: mongodb, session, adminSession, security, auditLog, cloudinary,
                          #   complaintStatus, complaintMedia, voter{Registry,Import,Lookup,ColumnMap}, dbSeed, constituencies, analyticsDisplay
constants/               # roles, statuses, routes, constituencies, ui, flag_assets (130KB base64 SVGs)
types/                   # Complaint (rich), User, Voter, Analytics. NOTE: representative.ts & fieldOfficer.ts are just `export type X = User`
utils/                   # date.ts, maps.ts
middleware.ts            # auth/role gate for pages + APIs (Next 16 successor: proxy.ts)
next.config.ts           # images.remotePatterns + outputFileTracingIncludes bundles lib/Voter_List.xlsx into /api/voter/verify
```
> Removed 2026-06-21: `services/`, `hooks/`, `validators/`, `scratch/`, and stray root/`app` HTML prototypes — all dead (imported by nothing). See §4.

**Naming:** route handlers always `route.ts`, components `PascalCase.tsx`, lib/util helpers `camelCase.ts`, hooks (if reintroduced) `useX.ts`.

---

## 6. API Route Handlers — conventions (match existing handlers)

- **File:** `app/api/<segment>/route.ts`; named async exports per verb (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`) using `NextRequest`/`NextResponse`.
- **Standard pipeline** (see `app/api/complaints/route.ts`): `getClientIp` → `validateRequestHeaders` (400) → `checkRateLimit` (429) → read `site_auth` cookie → `verifySession` (401) → role/constituency authorization → `getDb()` query → normalize (`normalizeStatus`, `normalizeComplaintMedia`) → `logAuditEvent`/`logSecurityEvent`.
- **Responses:** success returns the resource directly (`NextResponse.json(data)`, arrays/objects unwrapped). Errors: `NextResponse.json({ error: "<Tamil> (<English>)" }, { status })`. **Keep error messages bilingual, Tamil-first.**
- **Status codes:** 400 bad input/headers · 401 unauthenticated · 403 wrong role · 409 duplicate · 429 rate-limited · 503 Cloudinary unconfigured · 500 unexpected. Wrap bodies in `try/catch`.
- **Validate all client input** inline + via `lib/security.ts` (`sanitizeInput` strips `$`-keys and dots; `validateBase64File`; `checkDuplicateComplaint`). Never trust request bodies.
- **Avoid `any`** on Mongo filters/docs in new code (existing code uses `filter: any` — don't propagate).

### Endpoint summary (verified)
| Method & Path | Auth | Rate limit | Notes |
|---|---|---|---|
| `POST /api/login` | public | `admin_login` 20/min | blank username + `SITE_PASSWORD` → `SUPER_ADMIN`; sets `site_auth` |
| `GET /api/auth/me` | cookie | — | `{ authenticated, user? }` |
| `GET /api/complaints` | session | `analytics_api_get` 60/min | REP→by constituency, FIELD_OFFICER→by `assignedTo` |
| `POST /api/complaints` | **public** | `complaint_submit` 5/hr + `file_upload` 10/hr | honeypots, duplicate check, Cloudinary, generates `trackingId` |
| `PATCH /api/complaints` | session+role | **none** | actions: `assign`, `start_work`, `submit_solution`, `rep_approve`, `rep_reject`, `admin_approve`, `admin_reject` + an 8th legacy raw-`status` fallback |
| `GET /api/track?trackingId=` | public | `public_track` 30/min | `^ETT-\d{4}-\d{5}$` |
| `POST /api/voter/verify` | public | `voter_verify` 10/hr | by `voterId`, or fallback name/doorNo/dob/wardNo match (Levenshtein) |
| `GET/POST/PATCH /api/representative/officers` | REP or SUPER_ADMIN | — | field-officer CRUD, scoped to constituency |
| `GET /api/admin/dashboard` | SUPER_ADMIN | — | KPI stats |
| `GET/POST/PATCH /api/admin/representatives` | SUPER_ADMIN | — | one rep per constituency; strips `passwordHash` |
| `GET /api/admin/voters` | SUPER_ADMIN | — | paginated (limit ≤100), filter by search/constituency/ward |
| `POST /api/admin/voters/analyze` | SUPER_ADMIN | — | FormData preview (no write) → `lib/voterImport.analyzeVoterFile` |
| `POST /api/admin/voters/import` | SUPER_ADMIN | — | FormData import → `lib/voterImport.importVoterFile` |
| `GET /api/admin/voters/stats` · `GET/DELETE /api/admin/voters/history` | SUPER_ADMIN | — | totals / import history |
| `GET/POST/DELETE /api/admin/demo` | REP or SUPER_ADMIN | — | `demoComplaints` CRUD (analytics demo data) |
| `GET /api/public/analytics?constituency=` | public | `public_analytics` 60/min | 6-way aggregation, ≤500 records |
| `GET /api/public/resolved?limit=` | public | `public_resolved` 60/min | resolved showcase, anonymized before/after |

---

## 7. Domain Data Model

**MongoDB, raw driver** — `const db = await getDb()` (`@/lib/mongodb`), then `db.collection(...)`. No schema enforcement at the DB; validate in app code.

**Collections (8, verified):** `users` · `citizenComplaints` · `voterRegistry` · `importHistory` · `auditLogs` · `security_logs` (30-day TTL) · `rate_limits` (TTL) · `demoComplaints`.

**Complaint** (`types/complaint.ts`): `trackingId`, `voterVerified`, `voterId`, `verificationMethod`, location fields, `ward`, `constituency`, `citizenDetails{name,mobile,aadhaar?,gender,age,dob,address}`, `complaintDetails{category,subcategory,description,urgency}`, media (`photoUrls[]`/`videoUrls[]` **and** legacy `mediaUrls{photos,video}` — reconciled by `lib/complaintMedia.ts`), `status`, `timeline[]`, assignment/approval fields, `createdAt`/`updatedAt`.

**Status workflow** — canonical codes (`constants/statuses.ts`): `registered`, `under_review`, `assigned`, `work_in_progress`, `solution_submitted`, `pending_admin_approval`, `resolved`. ⚠️ `pending_rep_approval` is defined but **never set by any code path**. Legacy codes `pend`/`warn`/`ok` still exist and **new complaints are created with `status: "pend"`**; `normalizeStatus()` (`lib/complaintStatus.ts`) maps legacy→canonical on read. `rep_approve`/`admin_approve` etc. are **PATCH actions, not statuses**. Use these helpers + constants — never hardcode status strings.

**Voter registry:** imported from Excel (`lib/Voter_List.xlsx`) via `lib/voter*`; `/api/voter/verify` needs that xlsx bundled (`outputFileTracingIncludes` in `next.config.ts` — don't remove). Import: `.xlsx/.xls/.csv` ≤50MB, batches of 500, Tamil/English column auto-detect (min confidence 55). On an empty registry, `lib/dbSeed.ts` lazily seeds from the xlsx.

---

## 8. Auth & Authorization (verified)

- **Session cookie `site_auth`** = `base64(JSON).sha256_signature`, `httpOnly`, `sameSite: strict`, 7-day expiry, `secure` in production. Built/verified in `lib/session.ts` (custom pure-JS SHA-256 for Edge compat). Admin helpers in `lib/adminSession.ts`.
- **Passwords:** unsalted SHA-256 in `users.passwordHash` (weak by design — don't "improve" silently; flag it).
- **Two enforcement layers, keep both in sync:**
  1. `middleware.ts` — gates protected pages (`/complaints*`, `/admin*`) and APIs (`/api/admin/*`, GET/PATCH `/api/complaints`); redirects unauthenticated browsers to `/login?redirect=…`; restricts `/admin*` to `SUPER_ADMIN`. **`POST /api/complaints` is intentionally public** (citizen submission).
  2. **In-handler checks** re-verify the session and scope data by role (REP→`constituency`, FIELD_OFFICER→`assignedTo`). Don't rely on middleware for data scoping.
- Adding a protected route → update **both** `middleware.ts` and the in-handler authorization.

---

## 9. Commands

```bash
npm install        # node_modules is currently absent
npm run dev        # local dev (http://localhost:3000)
npm run build      # production build — best way to catch type/route errors
npm run start      # serve production build
npm run lint       # eslint
```
**No tests exist.** Verify changes via `npm run build` + exercising the route in `npm run dev`.

**Key env vars** (`.env.local`, gitignored — never commit): `MONGODB_URI` (default `mongodb://localhost:27017/tvk-west`), `MONGODB_URI_STANDARD` (SRV/DNS workaround), `MONGODB_DB_NAME` (⚠️ falls back to `"test"` for SRV URIs without a path), `SESSION_SECRET`, `SITE_PASSWORD` (default `thalapathy`), `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`.

---

## 10. Known Hazards / Guardrails

**Code-quality / dead code (cleanup debt — none blocks the app):**
- `app/page.tsx` is a **2,214-line `// @ts-nocheck` mega client component** (~653 KB). Make targeted edits; don't bulk-reformat. Refactors → propose extracting into `components/` and confirm scope first. **(Phase 3 target.)**
-  `app/analytics/page.tsx` still carries ~270 lines of **orphaned complaint-modal code** (marked `{/* COMPLAINT POPUP MODAL MOVED TO HOME PAGE */}`) — not yet removed (delicate in-file surgery; no git undo available).
- `types/representative.ts` & `types/fieldOfficer.ts` are pass-through `= User` aliases. Loose `any` on Mongo filters in places.

**Correctness/security to be aware of (don't regress; fix only when in scope):**
- **Rate limiter fails open** — on a Mongo error `checkRateLimit` returns success (`lib/security.ts`). Rate limits vanish if the DB is unreachable.
- **`trackingId` generation is non-atomic** (read-latest-then-increment, no counter/transaction) — concurrent submissions can collide.
- **`/api/public/analytics` "excludes rejected" is effectively a no-op** — it filters `approvalStatus: "REJECTED"`, but no code path ever sets that value (reject actions write `representativeApproval`/`adminApproval` instead).
- `validateRequestHeaders` isn't applied on every endpoint (e.g. `/api/auth/me`, several admin routes).
- **Secrets come from env** — never hardcode/commit them.

---

## 11. Working Agreement

- Read the relevant existing file/pattern before adding a new one — match the **actual** convention (inline `fetch` + logic in `route.ts`), not the aspirational folder structure.
- Keep changes minimal and scoped; this is a live app with real constituent data.
- Preserve Tamil strings exactly; mirror the Tamil-first / English-in-parens convention for new user-facing copy.
- When a Next.js 16 behavior is uncertain, consult `node_modules/next/dist/docs/` rather than guessing.
- Don't add dependencies, rename framework files, or restructure folders without flagging it first.

---

## 12. Current State / In Progress

A **finished frontend** (migrated from a static HTML prototype) on a **fully-implemented MongoDB API**. All six page routes (home, login, track, analytics, complaints, my-tasks, admin) work end-to-end. No half-built feature — outstanding work is cleanup + UI polish, run as a 3-phase effort (plan agreed 2026-06-21).

**Versioning:** the project has **no git repo of its own** (it sits inside a stray home-rooted repo — do **not** commit from here). Per the user's choice, changes are left in the working tree, **no commits**. Verify via `npm run build` + browser.

**Phase 1 — low-risk fixes (in progress):**
- ✅ Red/green completion bug — the success/error box in `complaints` + `my-tasks` detected success by `"✅"` (which no success message contained), so completions rendered in red error styling. Now detects *errors* by `"பிழை"`; successes render green.
- ✅ Site-wide smooth scroll — `scroll-behavior: smooth` + `scroll-padding-top` + `prefers-reduced-motion` guard in `app/globals.css`.
- ✅ Dead code deleted — `services/`, `hooks/`, `validators/`, `scratch/`, stray HTML.
-  Remaining: validation + correctness review/fixes; remove the ~270 orphaned lines in `app/analytics/page.tsx`.

**Phase 2 — mobile responsiveness** (not started).
**Phase 3 — split the 2,214-line `app/page.tsx`** into components (not started; highest risk, build-verify each extraction).

**Known correctness items** (don't regress; fix when in scope): non-atomic `trackingId`, fail-open rate limiter, the no-op `approvalStatus: "REJECTED"` analytics filter, unsalted password hashing, and legacy-status (`pend`/`warn`/`ok`) + dual media-shape consolidation.

> Update this section as work progresses so the next session has context.

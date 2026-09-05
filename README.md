# Swapply Admin Portal

Production-ready Next.js frontend admin portal for the Swapply fintech platform. Built for authorized administrators to manage users, wallets, transactions, KYC, exchange requests, compliance cases, configuration, system settings, and operational monitoring.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui primitives |
| State (client) | Zustand |
| State (server) | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Dates | date-fns |
| Icons | lucide-react |
| Toasts | Sonner |
| Testing | Vitest + React Testing Library |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

If your API is on the same origin as the frontend (e.g., via a reverse proxy), leave `NEXT_PUBLIC_API_BASE_URL` empty.

### 3. Run in development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm start
```

### 5. Lint

```bash
npm run lint
```

### 6. Type-check

```bash
npm run typecheck
```

### 7. Run tests

```bash
npm run test:run
```

---

## Authentication Flow

The portal uses a **dual-token** auth pattern:

| Token | Location | Notes |
|---|---|---|
| `accessToken` | **In-memory only** (Zustand) | Expires ~15 minutes. Never stored in localStorage or sessionStorage. |
| `refreshToken` | **HttpOnly cookie** (set by backend) | Never read or stored by frontend. Sent automatically by the browser. |

**Bootstrap flow:**
1. On app load, the `SessionBootstrap` component calls `POST /api/v1/auth/refresh`.
2. If the HttpOnly cookie is valid, the backend returns a new `accessToken` and `user`.
3. The access token is stored in Zustand memory.
4. If refresh fails, the user is treated as logged out and redirected to `/login`.

**Token refresh on 401:**
- Any API call returning 401 triggers an automatic refresh.
- A global lock prevents multiple concurrent refresh calls — all pending requests wait for one refresh to complete.
- If refresh fails, auth state is cleared and the user is redirected to `/login`.

**Logout:**
- Calls `POST /api/v1/auth/logout` to invalidate the HttpOnly cookie.
- Clears in-memory auth state.
- Redirects to `/login`.

---

## API Base URL

Set `NEXT_PUBLIC_API_BASE_URL` to the base URL of the Swapply backend API.

- If empty or unset, all API requests use **relative paths** (assumes same-origin deployment or a proxy).
- Do **not** include a trailing slash.

Examples:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=https://api.swapply.com
```

All API logic lives in `src/lib/api/`. No component calls `fetch` directly.

---

## Role Permissions

There are two admin roles:

### SUPER_ADMIN
Full access to all read and write operations including:
- Configuration management (margins, fees, biller pricing, feature flags)
- System management (maintenance mode, banners, broadcast notifications)
- Compliance case management and fund freezing
- User danger zone actions (reset password, reset PIN)
- Feature lock management
- Server log access
- Webhook reprocessing

### SUPPORT
Read-mostly access:
- View users, wallets, transactions, KYC queue, exchange queues
- Can approve/reject crypto, gift card, and KYC submissions (if backend allows)
- Cannot edit configuration
- Cannot send broadcasts
- Cannot reset credentials
- Cannot access server logs
- Cannot toggle feature flags or maintenance mode

> **Note:** Frontend RBAC is for UX clarity only. All authorization must also be enforced by the backend.

---

## NDPR / NDPA Privacy Notes

This portal handles personal data (names, emails, phones, BVN, NIN, KYC documents, financial records) subject to Nigeria's Data Protection Regulation (NDPR) and Data Protection Act (NDPA).

Frontend privacy controls implemented:
- **Data minimization:** Full user profiles only loaded on detail pages. KYC documents only shown when explicitly opened.
- **Sensitive data masking:** Phone numbers and emails masked in tables. Processor responses and webhook payloads collapsed by default.
- **Redaction in logs:** Client-side redaction of tokens, passwords, BVN, NIN, card PANs, auth headers, and other sensitive patterns before display.
- **Admin intent confirmation:** Required dialogs before all destructive or sensitive actions.
- **No unsafe storage:** Access tokens never persisted to localStorage/sessionStorage. No KYC or personal data cached in browser storage.
- **Privacy notices:** Displayed on KYC, audit log, compliance cases, and logs pages.
- **Compliance footer:** Present on all admin pages.
- **Idle session timeout:** Warning at 11 minutes, forced logout at 12 minutes of inactivity.

---

## CBN-Style Financial Governance Notes

- Clear transaction visibility with type, status, reference, balance before/after
- Status badges: SUCCESS, PENDING, FAILED
- VAS reconciliation: total user debits, provider cost, profit, count
- Treasury summary: total users, active wallets, platform balance stats
- Compliance case workflow with enforced status transitions (OPEN → INVESTIGATING → FUNDS_FROZEN → RESOLVED → CLOSED)
- Case notes are append-only (no edit/delete)
- Fund freezing requires strong confirmation dialog
- Broadcast notifications are "queued" not "sent" in all UX copy
- Maintenance mode changes require admin confirmation
- All exchange approvals/rejections require confirmation dialogs
- Maker-checker style UX: confirmation dialogs capture reason fields where endpoints support it

---

## Security Notes

- Access token stored **in memory only** (Zustand). Cleared on logout and tab close.
- Refresh token stored in **HttpOnly cookie** by backend. Frontend cannot read it.
- All API requests send `credentials: "include"` so the refresh cookie is always sent.
- No tokens, passwords, or PINs are ever logged to the console.
- Log viewer redacts sensitive data client-side before display.
- JSON payloads collapse sensitive keys (password, token, bvn, nin, etc.) to `[REDACTED]`.
- Download button on logs page downloads only the redacted version.
- `robots.txt` equivalent: `noindex, nofollow` set in metadata.
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` set in `next.config.ts`.
- Password input uses `autoComplete="current-password"` and no credentials are ever console-logged.

---

## Folder Structure

```
src/
├── app/                       # Next.js App Router pages
│   ├── (auth)/login/          # Public login page
│   ├── (admin)/               # Protected admin pages
│   │   ├── dashboard/
│   │   ├── users/[id]/
│   │   ├── transactions/reconciliation/
│   │   ├── exchange/crypto/ & gift-cards/
│   │   ├── kyc/
│   │   ├── compliance/fraud-rules/ cases/ audit-log/
│   │   ├── config/margins/ fee-rules/ biller-pricing/ feature-flags/
│   │   ├── system/maintenance/ banners/ notifications/
│   │   ├── integrations/health/ webhooks/
│   │   └── logs/
│   ├── layout.tsx             # Root layout with providers
│   ├── providers.tsx          # QueryClient + SessionBootstrap + Toaster
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # AppShell, Sidebar, Topbar, PageHeader
│   ├── auth/                  # LoginForm
│   ├── rbac/                  # RoleGate, ForbiddenCard
│   ├── common/                # StatCard, StatusBadge, Money, EmptyState, etc.
│   ├── transactions/          # TransactionTable
│   └── exchange/              # ExchangeQueueTable
├── hooks/                     # use-pagination, use-debounce, use-permissions, etc.
├── lib/
│   ├── api/                   # client.ts, admin-api.ts, auth-api.ts, errors.ts
│   ├── query-keys.ts
│   ├── permissions.ts
│   ├── redaction.ts
│   ├── formatters.ts
│   ├── utils.ts
│   └── constants.ts
├── stores/                    # auth-store.ts, ui-store.ts
├── types/                     # All TypeScript interfaces
└── schemas/                   # Zod validation schemas
```

---

## Common Troubleshooting

**"Cannot read properties of null" on auth store**
→ Make sure `SessionBootstrap` in `providers.tsx` runs before any authenticated content is rendered.

**401 errors looping**
→ Check that your backend sets the `refreshToken` as an HttpOnly cookie with `SameSite=None; Secure` for cross-origin use.

**API calls going to the wrong URL**
→ Verify `NEXT_PUBLIC_API_BASE_URL` in your `.env.local`. Must not have trailing slash.

**TypeScript errors on build**
→ Run `npm run typecheck` first to see all errors. All imports should use `@/` path aliases defined in `tsconfig.json`.

**Tailwind classes not applying**
→ Ensure `tailwind.config.ts` `content` array includes `src/**/*.{ts,tsx}`.

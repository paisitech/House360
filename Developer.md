# House360 — Developer Guide

Full project breakdown: where to find everything, how features connect, and where to add new code.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
```

## Tech Stack

- **Next.js 16.2.1** + React 19 + TypeScript 5
- **Supabase** — PostgreSQL, Auth, Realtime, Storage
- **SSLCommerz** — Payment gateway (bKash, Nagad, Rocket, Card, Bank Transfer)
- **Tailwind CSS 4** + Zod 4 validation + Lucide icons

## Project Map by Feature

### Authentication & Authorization

| What | Where |
|------|-------|
| Login page | `src/app/(public)/login/page.tsx` |
| Signup page | `src/app/(public)/signup/page.tsx` |
| Login form component | `src/components/auth/login-form.tsx` |
| Signup form component | `src/components/auth/signup-form.tsx` |
| Auth validators (Zod) | `src/lib/validators/auth.ts` |
| OAuth callback | `src/app/auth/callback/route.ts` |
| Route protection & role gating | `src/middleware.ts` |
| Auto-create profile on signup | `supabase/schema.sql` → `handle_new_user()` trigger |
| Supabase browser client | `src/lib/supabase/client.ts` |
| Supabase server client | `src/lib/supabase/server.ts` |
| Supabase admin (bypass RLS) | `src/lib/supabase/admin.ts` |

**How auth works:**
1. User signs up → Supabase Auth creates `auth.users` row
2. `handle_new_user()` trigger fires → creates row in `public.users` + `public.landlords` (if role=landlord)
3. Middleware checks role and redirects: landlords → `/landlord/*`, tenants → `/tenant/*`
4. Tenant linking: landlord creates tenant with email → tenant signs up with same email → trigger auto-links via `user_id`

### Properties

| What | Where |
|------|-------|
| List page | `src/app/(dashboard)/landlord/properties/page.tsx` |
| Detail page (building visual) | `src/app/(dashboard)/landlord/properties/[propertyId]/page.tsx` |
| Create page | `src/app/(dashboard)/landlord/properties/new/page.tsx` |
| Edit page | `src/app/(dashboard)/landlord/properties/[propertyId]/edit/page.tsx` |
| Server actions (CRUD) | `src/app/(dashboard)/landlord/properties/actions.ts` |
| Form component | `src/components/properties/property-form.tsx` |
| Building visual (unit map) | `src/components/properties/building-visual.tsx` |
| Validator | `src/lib/validators/property.ts` |

**How property creation works:**
1. User fills form with name, address, floors, units/floor, default rent
2. `createProperty` action creates property → auto-generates all units (e.g., 1A, 1B, 2A, 2B...)
3. Property detail page shows building visual with color-coded units (green=vacant, blue=occupied, yellow=maintenance)
4. Clicking a unit opens inline side panel for info/edit/assign tenant/add unit

### Units

| What | Where |
|------|-------|
| Detail page | `...properties/[propertyId]/units/[unitId]/page.tsx` |
| Create page | `...properties/[propertyId]/units/new/page.tsx` |
| Edit page | `...properties/[propertyId]/units/[unitId]/edit/page.tsx` |
| Assign tenant page | `...properties/[propertyId]/units/[unitId]/assign/page.tsx` |
| Server actions (CRUD) | `...properties/[propertyId]/units/actions.ts` |
| Form component | `src/components/units/unit-form.tsx` |
| Validator | `src/lib/validators/unit.ts` |

### Tenants

| What | Where |
|------|-------|
| List page | `src/app/(dashboard)/landlord/tenants/page.tsx` |
| Detail page | `...tenants/[tenantId]/page.tsx` |
| Create page | `...tenants/new/page.tsx` |
| Edit page | `...tenants/[tenantId]/edit/page.tsx` |
| Create lease page | `...tenants/[tenantId]/lease/new/page.tsx` |
| Server actions (CRUD + lease) | `src/app/(dashboard)/landlord/tenants/actions.ts` |
| Tenant form component | `src/components/tenants/tenant-form.tsx` |
| Lease form component | `src/components/tenants/lease-form.tsx` |
| Validator (tenant) | `src/lib/validators/tenant.ts` |
| Validator (lease) | `src/lib/validators/lease.ts` |

**How lease assignment works:**
1. Landlord assigns tenant to a vacant unit (from building visual or unit page)
2. `createLease` action creates lease → sets unit status to "occupied" → generates rent cycle for current month
3. Tenant can now see rent due in their portal

### Payments

| What | Where |
|------|-------|
| Landlord payments page | `src/app/(dashboard)/landlord/payments/page.tsx` |
| Landlord payment actions | `src/app/(dashboard)/landlord/payments/actions.ts` |
| Tenant rent-due page | `src/app/(dashboard)/tenant/rent-due/page.tsx` |
| Tenant payment history | `src/app/(dashboard)/tenant/payment-history/page.tsx` |
| Tenant screenshot upload | `src/app/(dashboard)/tenant/upload-screenshot/page.tsx` |
| Pay rent button | `src/components/payments/pay-rent-button.tsx` |
| Screenshot upload form | `src/components/payments/screenshot-upload-form.tsx` |
| Payment verification button | `src/components/payments/payment-verification-button.tsx` |
| Generate cycles button | `src/components/payments/generate-cycles-button.tsx` |
| Validator | `src/lib/validators/payment.ts` |

### Payment API (SSLCommerz)

| What | Where |
|------|-------|
| Create payment → gateway | `src/app/api/payments/create/route.ts` |
| IPN webhook (server-to-server) | `src/app/api/payments/ipn/route.ts` |
| Success redirect | `src/app/api/payments/success/route.ts` |
| Fail redirect | `src/app/api/payments/fail/route.ts` |
| Cancel redirect | `src/app/api/payments/cancel/route.ts` |
| SSLCommerz config | `src/lib/sslcommerz/config.ts` |
| SSLCommerz client | `src/lib/sslcommerz/client.ts` |

**Payment flow:**
1. Tenant clicks "Pay Online" → `/api/payments/create` → SSLCommerz gateway
2. SSLCommerz POSTs to `/api/payments/ipn` (server-to-server validation)
3. IPN handler validates, updates payment status, accumulates `amount_paid` on rent cycle
4. **Manual payments:** tenant uploads screenshot → landlord verifies (approve/reject) from payments page

### Cron Jobs

| What | Where |
|------|-------|
| Generate rent cycles (25th monthly) | `src/app/api/cron/generate-rent-cycles/route.ts` |
| Send reminders (daily 8am) | `src/app/api/cron/send-reminders/route.ts` |
| Cron schedule config | `vercel.json` |

**How rent cycles work:**
1. Cron runs on 25th → generates next month's rent cycles for all active leases
2. `createLease` also generates current month's cycle immediately
3. "Generate Rent Cycles" button on payments page allows manual generation
4. Daily cron marks overdue cycles and sends reminders

### Reports & Dashboard

| What | Where |
|------|-------|
| Landlord dashboard | `src/app/(dashboard)/landlord/page.tsx` |
| Tenant dashboard | `src/app/(dashboard)/tenant/page.tsx` |
| Reports page | `src/app/(dashboard)/landlord/reports/page.tsx` |

### Layout & UI

| What | Where |
|------|-------|
| Root layout | `src/app/layout.tsx` |
| Public layout (navbar + footer) | `src/app/(public)/layout.tsx` |
| Dashboard layout (sidebar + topbar) | `src/app/(dashboard)/layout.tsx` |
| Sidebar (role-based nav) | `src/components/layout/sidebar.tsx` |
| Topbar (user info + logout) | `src/components/layout/topbar.tsx` |
| Public navbar | `src/components/layout/public-navbar.tsx` |
| Footer | `src/components/layout/footer.tsx` |
| Landing page | `src/app/(public)/page.tsx` |
| Pricing page | `src/app/(public)/pricing/page.tsx` |

### Shared UI Components

All in `src/components/ui/`:
`button.tsx`, `input.tsx`, `card.tsx`, `badge.tsx`, `select.tsx`, `table.tsx`, `dialog.tsx`, `toast.tsx`, `file-upload.tsx`

### Shared Utilities

| What | Where |
|------|-------|
| `cn()`, `formatCurrency()`, `formatDate()`, `generateTranId()` | `src/lib/utils.ts` |
| Status labels/colors, app constants | `src/lib/constants.ts` |
| All TypeScript types | `src/types/index.ts` |
| SSLCommerz type defs | `src/types/sslcommerz-lts.d.ts` |
| Custom hooks (`useUser`, `useRealtime*`) | `src/hooks/` |

### Database

| What | Where |
|------|-------|
| Full combined schema | `supabase/schema.sql` |
| Migrations (ordered) | `supabase/migrations/00001–00009_*.sql` |
| Seed data | `supabase/seed.sql` |
| Enums | `00001_create_enums.sql` |
| Users & landlords tables | `00002_create_users_landlords.sql` |
| Properties & units tables | `00003_create_properties_units.sql` |
| Tenants & leases tables | `00004_create_tenants_leases.sql` |
| Rent cycles & payments | `00005_create_rent_cycles_payments.sql` |
| Manual payments & reminders | `00006_create_manual_payments_reminders.sql` |
| RLS policies | `00007_create_rls_policies.sql` |
| DB functions (rent cycles, overdue) | `00008_create_functions.sql` |
| Storage buckets | `00009_create_storage_buckets.sql` |

**Key DB concepts:**
- `get_landlord_id()` — helper function used in RLS policies for multi-tenant isolation
- `handle_new_user()` — trigger on `auth.users` INSERT, uses `SET search_path = public` (required for custom enums)
- `generate_rent_cycles(target_month)` — creates monthly rent obligations for all active leases
- `mark_overdue_cycles()` — updates status for past-due rent cycles
- All tables have `updated_at` auto-update triggers

## Adding New Features — Where to Put What

| To add... | Do this |
|-----------|---------|
| **New landlord page** | Create `src/app/(dashboard)/landlord/{feature}/page.tsx` + add nav link in `src/components/layout/sidebar.tsx` |
| **New tenant page** | Create `src/app/(dashboard)/tenant/{feature}/page.tsx` + add nav link in `src/components/layout/sidebar.tsx` |
| **New server action** | Add to existing `actions.ts` in the feature folder, or create new one. Follow pattern: `FormData → Zod parse → Supabase → revalidatePath → ActionResult` |
| **New form component** | Create in `src/components/{feature}/` as `"use client"` component |
| **New Zod validator** | Create in `src/lib/validators/{entity}.ts` |
| **New DB table** | Add migration in `supabase/migrations/`, update `supabase/schema.sql`, add type in `src/types/index.ts` |
| **New enum** | Add to `00001_create_enums.sql` + `schema.sql`, add TypeScript union in `src/types/index.ts` |
| **New RLS policy** | Add to `00007_create_rls_policies.sql` + `schema.sql` |
| **New API route** | Create `src/app/api/{path}/route.ts` |
| **New cron job** | Create `src/app/api/cron/{name}/route.ts` + add schedule to `vercel.json` |
| **New UI component** | Create in `src/components/ui/` |
| **New constant/status map** | Add to `src/lib/constants.ts` |
| **New public page** | Create in `src/app/(public)/` |

## Conventions

- **Server components are default.** Add `"use client"` only for interactivity (forms, state, effects).
- **Server actions** use `"use server"` and live in `actions.ts` alongside their routes.
- **All user input** is validated with Zod before DB operations.
- **`ActionResult<T>`** = `{ success: boolean; error?: string; data?: T }` — standard return type for all server actions.
- **Supabase clients:** Use `createClient()` (server) in pages/actions, `createBrowserClient()` in client components, `supabaseAdmin` only for RLS-bypass (cron, webhooks).
- **`revalidatePath()`** after every mutation to refresh server-rendered data.
- **Status colors/labels** are centralized in `src/lib/constants.ts` — don't hardcode.
- **Currency** uses `formatCurrency()` (BDT format), **dates** use `formatDate()` (Bengali locale).
- **Unit naming:** Auto-generated as `{floor}{letter}` — e.g., 1A, 1B, 2A, 2B.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role (server-only)
SSLCOMMERZ_STORE_ID               # SSLCommerz store ID
SSLCOMMERZ_STORE_PASSWD           # SSLCommerz store password
SSLCOMMERZ_IS_LIVE                # "true" for production, "false" for sandbox
NEXT_PUBLIC_APP_URL               # App URL (e.g., http://localhost:3000)
CRON_SECRET                       # Bearer token for cron job authorization
```

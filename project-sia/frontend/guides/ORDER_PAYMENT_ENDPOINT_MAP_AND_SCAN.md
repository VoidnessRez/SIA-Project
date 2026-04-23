# Order-Payment Endpoint Map and End-to-End Scan

Date: 2026-04-13
Scope: Todo #1 (Map current order-payment endpoints) + runtime endpoint scan

## 1) Frontend Entry Points

### Checkout submit
- File: frontend/src/pages/checkout/Checkout.jsx
- Action: Builds order payload and calls POST /api/orders/create.
- Payload includes:
  - user_id
  - customer_name, customer_email, customer_phone
  - fulfillment_method
  - payment_method (cod/gcash/bank transfer label handling in UI)
  - delivery_* fields
  - items[]
  - subtotal, shipping_fee, tax_amount, discount_amount, total_amount

### User order history
- File: frontend/src/pages/orders/Orders.jsx
- Action: Calls GET /api/orders, then filters orders by logged-in user_id on client side.

### Admin customer orders
- File: frontend/src/admin/admComponents/ordersAndSales/customerOrders/CustomerOrders.jsx
- Action: Reads and updates orders directly via Supabase client, not via backend orders endpoints.

## 2) Backend Endpoints in Use

### Orders routes
- File: backend/routes/orders.js
- Registered in: backend/index.js at /api/orders

Endpoints:
- POST /api/orders/create
  - Validates input and stock availability
  - Creates row in orders
  - Creates rows in order_items
  - Deducts stock (inventory transaction recorded)
  - Attempts receipt email send and returns delivery diagnostics
- GET /api/orders
  - Returns all orders with order_items relation
- GET /api/orders/:id
  - Returns one order with order_items relation
- PUT /api/orders/:id/status
  - Handles status transition and timestamp fields
  - Restores stock when moving pending_approval/confirmed to cancelled
  - Accepts cancellation_reason and admin_notes

### Upload routes (current)
- File: backend/routes/upload.js
- Registered in: backend/index.js at /api/upload
- Available now:
  - POST /api/upload/avatar
  - POST /api/upload/product-image
  - POST /api/upload/payment-proof
  - DELETE /api/upload/product-image

## 3) Database Fields Relevant to Payment Flow

Source: backend/supabase/INVENTORY_SCHEMA.sql

orders table has:
- payment_method
- payment_status (default pending)
- payment_proof_url
- order_status
- cancellation_reason
- admin_notes
- tracking/courier and lifecycle timestamps

## 4) Runtime Scan Results

Validated on running backend:
- GET /api/health -> OK
- GET /api/orders -> OK (returns JSON with orders and order_items)

Observed payload evidence from live /api/orders response includes:
- payment_method
- payment_status
- payment_proof_url
- cancellation_reason
- fulfillment_method

## 5) End-to-End Flow (Current)

1. User submits checkout in frontend.
2. Frontend calls POST /api/orders/create.
3. Backend writes orders + order_items, deducts stock, sends receipt email.
4. User order page fetches GET /api/orders and client-filters by user_id.
5. Admin customer orders page currently performs direct Supabase updates for status/notes/decline.

## 6) Audit Verdict for Todo #1

Status: COMPLETE

What is okay now:
- Core create/read/status routes exist and run.
- Payment-related columns already exist in schema and runtime response.
- Stock deduction and cancellation-restock logic exist in backend orders status route.

Gaps found (important for next todos):
- Admin order status updates bypass backend route by writing directly through Supabase in frontend admin page. This can bypass centralized business rules.
- User orders page fetches all orders then filters on client; should be server-filtered for tighter data exposure.
- No dedicated payment-proof upload endpoint yet for GCash verification workflow.
- No explicit status enum yet for "incomplete_transaction".

## 7) Recommended Next Implementation Order

1. Define new order/payment statuses and transition rules.
2. Add payment-proof upload endpoint and storage path policy.
3. Move admin order status actions to backend endpoint to enforce rules consistently.
4. Add server-side user filtering endpoint for order history.

---

## 8) Todo #2 Implementation: Incomplete Transaction Status

Status: COMPLETE

Technical definition used:
- DB-safe key: `incomplete_txn`
- Display label in UI: `Incomplete Transaction`

Why DB-safe key was used:
- Current `orders.order_status` type is `VARCHAR(20)`.
- Literal `incomplete_transaction` exceeds 20 chars and fails writes.

Code updates made:
- Backend status constants + whitelist validation:
  - backend/routes/orders.js
- User Orders status map and processing-group filter support:
  - frontend/src/pages/orders/Orders.jsx
- Admin Customer Orders filter tab + labels support:
  - frontend/src/admin/admComponents/ordersAndSales/customerOrders/CustomerOrders.jsx

Final endpoint scan for #2:
- GET /api/health -> OK
- PUT /api/orders/:id/status with `not_a_real_status` -> rejected (invalid status)
- PUT /api/orders/:id/status with `incomplete_txn` -> accepted
- PUT /api/orders/:id/status with `pending_approval` -> accepted (reset after scan)

---

## 9) Todo #3 Implementation: Separate Buyer-Cancelled Logic

Status: COMPLETE

Separation applied:
- `declined_admin` -> admin explicitly declines order
- `buyer_cancelled` -> buyer cancels order via dedicated endpoint
- `cancelled` remains accepted for legacy compatibility

Backend changes:
- Added statuses in `ORDER_STATUSES` and whitelist validation.
- Added dedicated endpoint:
  - `PUT /api/orders/:id/cancel-by-buyer`
- Updated cancellation handling in `PUT /api/orders/:id/status` so stock-restore path applies to:
  - `cancelled`
  - `declined_admin`
  - `buyer_cancelled`
- Added safe fallback behavior so inventory-transaction logging mismatch does not block stock/status updates.

Frontend changes:
- User Orders page:
  - New labels: "Cancelled by You" and "Declined by Admin"
  - Added buyer cancel action in order modal (for pending/incomplete/confirmed)
- Admin Customer Orders page:
  - Decline action now sets `declined_admin`
  - Added separate filter tabs for `declined_admin` and `buyer_cancelled`

Final endpoint scan for #3:
- GET `/api/health` -> OK
- PUT `/api/orders/:id/status` with `declined_admin` -> accepted
- PUT `/api/orders/:id/cancel-by-buyer` from `pending_approval` -> accepted
- PUT reset back to `pending_approval` -> accepted

---

## 10) Todo #4 Implementation: Add GCash Receipt Upload Flow

Status: COMPLETE

Backend changes:
- Added dedicated endpoint in upload routes:
  - `POST /api/upload/payment-proof`
- Endpoint behavior:
  - accepts image file field `receipt`
  - requires `orderId`
  - validates order exists and payment method is `gcash`
  - uploads file to storage path prefix `payments/gcash/`
  - updates `orders.payment_proof_url` and `orders.payment_status`

Frontend changes (User Orders modal):
- Added payment-proof visibility and upload UI for GCash orders.
- Added file picker + upload button for allowed statuses:
  - `pending_approval`
  - `incomplete_txn`
  - `confirmed`
- Shows uploaded proof link when available.

Final endpoint scan for #4:
- GET `/api/health` -> OK
- POST `/api/upload/payment-proof` with PNG image + orderId -> success
- GET `/api/orders/:id` after upload -> `payment_proof_url` populated

---

## 11) Todo #5 Implementation: QR Placeholder Management

Status: COMPLETE

Implemented behavior:
- Admin can upload/replace GCash QR image anytime.
- Checkout shows active QR image (placeholder-ready display).
- Checkout shows masked account identity for privacy.

Backend changes:
- Added endpoint:
  - `POST /api/upload/gcash-qr`
- Upload path:
  - `payments/gcash-qr/`

Frontend changes:
- System Settings payment tab now includes:
  - GCash first name
  - GCash last name
  - GCash number
  - QR replacement note
  - Upload/Replace QR action + preview
- Checkout GCash section now shows:
  - current QR image (or placeholder)
  - masked account name
  - masked account number
  - replacement note

Masking format used:
- Name sample output:
  - `j****** A*******`
- Number sample output:
  - `09********32`

Final endpoint scan for #5:
- GET `/api/health` -> OK
- POST `/api/upload/gcash-qr` with PNG image -> success
- Mask helper output test -> `j****** a*******` and `09********32`

---

## 12) Todo #6 Implementation: Admin Payment Verification Actions

Status: COMPLETE

Backend changes:
- Added endpoint:
  - `PUT /api/orders/:id/payment-status`
- Supported payment statuses:
  - `pending`
  - `paid`
  - `failed`
  - `refunded`
- Validation rules:
  - only supports GCash orders
  - cannot mark `paid` if there is no `payment_proof_url`
- Status behavior:
  - `paid` moves order to `confirmed` when currently pending/incomplete
  - `failed` moves order to `incomplete_txn` when currently pending/confirmed

Frontend changes (Admin Customer Orders modal):
- Added GCash verification section:
  - current payment status label
  - proof link and image preview
- Added action buttons:
  - `Approve Payment`
  - `Reject Payment`
- Actions call backend payment-status endpoint and refresh order list.

Final endpoint scan for #6:
- GET `/api/health` -> OK
- PUT `/api/orders/37/payment-status` with `paid` -> success, order moved to `confirmed`
- PUT `/api/orders/37/payment-status` with `failed` -> success, order moved to `incomplete_txn`
- Reset scan state -> final `payment_status=pending`, `order_status=pending_approval`

---

## 13) Todo #7 Implementation: Blurry Receipt Decision Path (Typed Reasons)

Status: COMPLETE

Implemented behavior:
- Admin reject/blurry action now requires typed reason.
- Backend rejects failed verification requests without reason.
- Admin reject reason is appended to `orders.admin_notes` with timestamp.
- Buyer reupload flow now accepts typed `reupload_reason`.
- Reupload from `incomplete_txn` automatically returns order to `pending_approval` and payment status to `pending`.
- Buyer reupload reason is appended to `orders.admin_notes` with timestamp.

Backend changes:
- `PUT /api/orders/:id/payment-status`
  - requires `admin_reason` when `payment_status=failed`
  - stores `[Admin Reject ...]` note in `admin_notes`
- `POST /api/upload/payment-proof`
  - accepts optional `reupload_reason`
  - when current order is `incomplete_txn`, sets `order_status` back to `pending_approval`
  - stores `[Buyer Reupload ...]` note in `admin_notes`

Frontend changes:
- Admin Customer Orders modal:
  - added textarea for reject/blurry reason
  - disable reject button until reason is provided
- User Orders modal:
  - added reupload reason textarea
  - requires reason if previous payment status is `failed`
  - shows current payment verification status and admin note context

Final endpoint scan for #7:
- GET `/api/health` -> `ok`
- PUT `/api/orders/37/payment-status` with `failed` and no reason -> HTTP `400`
- PUT `/api/orders/37/payment-status` with `failed` + `admin_reason` -> success (`payment_status=failed`, `order_status=incomplete_txn`)
- POST `/api/upload/payment-proof` with `reupload_reason` -> success (`payment_status=pending`, `order_status=pending_approval`)
- GET `/api/orders/37` final notes include both:
  - `[Admin Reject ...] Blurry receipt...`
  - `[Buyer Reupload ...] Reuploading with clearer receipt...`

---

## 14) Todo #8 Implementation: COD and GCash Rules (GCash-only Additional Step)

Status: COMPLETE

Rule applied:
- Additional payment verification step is added only when `payment_method=gcash`.
- Non-GCash methods keep normal fulfillment-based order flow.

Backend changes:
- In `POST /api/orders/create`:
  - normalized and validated payment methods (`cod`, `gcash`, `bank`)
  - `gcash` orders always start at `order_status=pending_approval`
  - `gcash` orders add initial note: `Waiting for GCash receipt upload and admin verification.`
  - non-GCash orders keep existing logic:
    - pickup -> `confirmed`
    - delivery -> `pending_approval`

Final endpoint scan for #8:
- GET `/api/health` -> `ok`
- POST `/api/orders/create` with pickup + `payment_method=cod` -> `order_status=confirmed`
- POST `/api/orders/create` with pickup + `payment_method=gcash` -> `order_status=pending_approval`
- Verification from `/api/orders`:
  - COD created order has `confirmed_at` set, no gcash note
  - GCash created order has no `confirmed_at`, and includes waiting-for-receipt admin note

---

## 15) Todo #9 Implementation: Enforce Downpayment Non-Refundable Policy

Status: COMPLETE

Policy applied:
- For GCash payments, once payment is verified as `paid`, the downpayment is non-refundable.

Backend enforcement:
- `PUT /api/orders/:id/payment-status`
  - blocks `payment_status=refunded` for GCash orders (returns HTTP 400)
- `PUT /api/orders/:id/cancel-by-buyer`
  - when order is paid GCash, keeps `payment_status=paid`
  - appends policy note in `admin_notes`
- `PUT /api/orders/:id/status`
  - when transitioning to cancellation statuses (`cancelled`, `buyer_cancelled`, `declined_admin`) on paid GCash
  - appends policy note in `admin_notes`

Frontend clarity updates:
- Checkout GCash card now shows policy reminder:
  - `GCash downpayment is non-refundable once verified by admin.`
- Buyer cancel confirmation now warns if order is paid via GCash.

Final end-to-end scan for #9:
- GET `/api/health` -> `ok`
- Created 2 GCash orders for policy test -> success
- Uploaded payment proofs for both -> HTTP `200`
- Marked both as paid -> success (`paid/confirmed`)
- Attempted `payment_status=refunded` -> blocked, HTTP `400`
- Buyer cancel on paid GCash -> success, `payment_status` stayed `paid`, `order_status=buyer_cancelled`
- Admin decline on paid GCash -> success, `payment_status` stayed `paid`, `order_status=declined_admin`
- Final `admin_notes` include policy line:
  - `GCash downpayment is non-refundable under store policy.`

---

## 16) Todo #10 Implementation: Design Wholesale Module Requirements

Status: COMPLETE (Design Phase)

Output delivered:
- New requirements design document:
  - `frontend/guides/WHOLESALE_MODULE_REQUIREMENTS.md`
- Document includes:
  - roles and workflows
  - server-authoritative pricing requirements
  - proposed DB tables and order extensions
  - proposed wholesale API surface
  - security, reporting, and phased implementation plan

Current-state endpoint scan for #10 (baseline):
- GET `/api/health` -> `ok`
- Created retail baseline order (`discount_amount=0`) -> accepted
- Created client-labeled wholesale order (`discount_amount=500`, `discount_type='Wholesale Bronze'`) -> accepted
- Retrieved both orders:
  - retail order stored `discount_amount=0`
  - client-labeled wholesale order stored `discount_amount=500`
  - order remained normal COD confirmed flow

Baseline finding captured:
- Backend currently accepts client-provided discount amounts without wholesale eligibility/module checks.
- Confirms the need for server-side wholesale pricing engine and dedicated wholesale entities in later implementation tasks.

---

## 17) Todo #11 Implementation: Create Terms and Privacy Pages

Status: COMPLETE

Implemented pages:
- `frontend/src/pages/legal/TermsAndConditions.jsx`
- `frontend/src/pages/legal/PrivacyPolicy.jsx`
- Shared styles:
  - `frontend/src/pages/legal/LegalPages.css`

Routing updates:
- Added public routes in `frontend/src/main.jsx`:
  - `/terms`
  - `/privacy`

Content coverage:
- Terms page includes:
  - order/payment clauses
  - non-refundable GCash downpayment policy statement
  - delivery, cancellation, liability, and terms update sections
- Privacy page includes:
  - collected data scope
  - payment proof handling
  - data usage, sharing, retention, and security sections

Final end-to-end scan for #11:
- Frontend build after route/page addition -> success
- Route registration check in source:
  - `/terms` route present
  - `/privacy` route present
- Live route access check:
  - opened `http://localhost:5173/terms` successfully
  - opened `http://localhost:5173/privacy` successfully

Note on scan tooling:
- Automated HTML content extraction from the dev-server pages failed in this environment,
  but route open checks and build validation both passed.

---

## 18) Todo #12 Implementation: Run End-to-End System Audit

Status: COMPLETE

Audit artifact:
- `frontend/guides/SYSTEM_E2E_AUDIT_2026-04-13.md`

Audit coverage:
- backend syntax integrity
- frontend production build
- critical order/payment runtime paths
- policy enforcement checks
- legal page route/link wiring checks

Final runtime scan snapshot:
- `HEALTH=ok`
- `CREATE=cod:.../confirmed,gcNoProof:.../pending_approval,gcProof:.../pending_approval`
- `UPLOAD_HTTP=cod:400,gcash:200`
- `PAID_NO_PROOF_HTTP=400`
- `PAID_WITH_PROOF=paid/confirmed`
- `REFUND_BLOCK_HTTP=400`
- `BUYER_CANCEL=paid/buyer_cancelled`
- `FINAL_NOTE_HAS_POLICY=True`

Route/link checks:
- `/terms` route present in `main.jsx`
- `/privacy` route present in `main.jsx`
- checkout terms text links to `/terms` and `/privacy`

Audit verdict:
- PASS for all audited critical paths.

---

## 19) Todo #13 Implementation: Add DB Migrations and Seed Updates

Status: COMPLETE

Delivered migration and seed artifacts:
- New migration:
  - `backend/migrations/005_create_wholesale_tables.sql`
- New seeder:
  - `backend/scripts/seed_wholesale.js`
- Script registration update:
  - `backend/package.json` -> added `seed:wholesale`
- Seeder guide update:
  - `backend/scripts/SEEDER_GUIDE.md`

Migration scope included:
- New wholesale tables:
  - `wholesale_profiles`
  - `wholesale_applications`
  - `wholesale_tier_rules`
  - `wholesale_quotes`
  - `wholesale_quote_items`
  - `order_audit_logs`
- Orders table extensions:
  - `order_channel`
  - `wholesale_profile_id`
  - `quote_id`
  - `downpayment_required_amount`
  - `downpayment_paid_amount`
  - `downpayment_policy_snapshot`
- Default wholesale tier seeds (idempotent upsert)

Final scan for #13:
- `node --check scripts/seed_wholesale.js` -> PASS
- `npm run | Select-String "seed:wholesale"` -> found `seed:wholesale`
- `DRY_RUN=1 npm run seed:wholesale` -> executable and correctly detects missing wholesale tables when migration is not yet applied

Runtime note:
- This workspace migration was prepared and validated for execution readiness.
- Supabase schema application must still be executed in SQL editor using:
  - `backend/migrations/005_create_wholesale_tables.sql`

---

## 20) Todo #14 Implementation: Add Tests and UAT Checklist

Status: COMPLETE

Delivered test and UAT artifacts:
- Automated E2E test script:
  - `backend/scripts/test_e2e_core_flows.mjs`
- NPM command registration:
  - `backend/package.json` -> `test:e2e:core`
- Team-facing UAT checklist:
  - `frontend/test/UAT_CHECKLIST_2026-04-13.md`
- Guide update for command usage:
  - `backend/scripts/SEEDER_GUIDE.md`

Automated test scan results (#14):
- `node --check scripts/test_e2e_core_flows.mjs` -> PASS
- `npm run test:e2e:core` -> PASS
  - health check
  - COD create rule
  - GCash create rule
  - COD proof upload rejection
  - GCash proof upload success
  - paid-without-proof validation
  - paid-with-proof transition
  - non-refundable refund block
  - buyer cancellation policy transition
  - policy note persistence
- `npm run build` (frontend) -> PASS

UAT coverage includes:
- checkout and legal acceptance
- GCash receipt and verification paths
- non-refundable payment policy validations
- status lifecycle checks
- legal page availability checks
- wholesale readiness checks

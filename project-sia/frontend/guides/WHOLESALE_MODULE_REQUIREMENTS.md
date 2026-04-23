# Wholesale Module Requirements

Date: 2026-04-13
Status: Design Complete (Implementation Pending)

## 1) Goals

- Support B2B and bulk buyers with explicit wholesale workflow.
- Keep retail checkout working as-is.
- Move discount authority from client-side computation to server-side policy engine.
- Keep inventory consistency, payment compliance, and auditable approvals.

## 2) Scope

In scope:
- Wholesale account lifecycle (apply, review, approve, suspend).
- Wholesale pricing policy and discount tiers.
- Wholesale quotation and order conversion flow.
- Downpayment rules for wholesale (GCash and non-GCash).
- Admin approval, notes, and audit trail.

Out of scope (for this phase):
- Multi-currency pricing.
- Third-party ERP integration.
- Automated tax invoicing with external BIR provider.

## 3) User Roles

- Buyer (Retail): Existing user, no wholesale privileges.
- Buyer (Wholesale): Approved account with wholesale access.
- Admin Sales: Reviews applications, quotes, and order approvals.
- Admin Inventory: Reviews stock feasibility and lead times.
- Super Admin: Overrides policies and manages tier rules.

## 4) Functional Requirements

### 4.1 Wholesale Eligibility

- Buyer can submit wholesale application with required business fields:
  - legal business name
  - business type
  - tax id (optional by policy)
  - contact person
  - contact mobile/email
  - business address
  - expected monthly volume
- Application states:
  - pending_review
  - approved
  - rejected
  - suspended
- Only approved wholesale buyers can access wholesale price requests/orders.

### 4.2 Wholesale Pricing Policy

- Discount and/or price override must be computed server-side.
- Tier policy is stored and versioned in DB.
- Each wholesale line item should persist:
  - base unit price
  - applied wholesale rule id
  - applied discount percent/amount
  - final unit price
- Prevent manual client discount tampering by recomputing totals server-side.

### 4.3 Wholesale Order Flow

- Wholesale buyer creates draft request (not immediate checkout order).
- Admin can:
  - approve requested quantities
  - adjust quantities based on stock
  - set lead time and validity window
- Buyer confirms approved quote to create final order.
- Final order keeps reference to source quote id.

### 4.4 Payments and Policy

- Support payment methods: gcash, bank, cod (subject to admin policy).
- Downpayment policy:
  - non-refundable after verified paid status
  - enforcement on backend regardless of caller
- For wholesale, allow configurable minimum downpayment percent (example: 30%).
- Block shipment progression if minimum required payment is not met.

### 4.5 Inventory and Fulfillment

- Reserve inventory on quote approval or order confirmation (choose policy flag).
- Record reservation expiry for unconfirmed quotes.
- Release reservation automatically when quote expires/cancelled.

### 4.6 Audit and Traceability

- Every approval/rejection/price override action must store:
  - actor id
  - action type
  - reason/note
  - timestamp
- All monetary transitions must be traceable in order timeline.

## 5) Data Model Requirements

Required new tables (proposal):
- wholesale_profiles
- wholesale_applications
- wholesale_tier_rules
- wholesale_quotes
- wholesale_quote_items
- wholesale_order_links
- order_audit_logs

Required order table additions (proposal):
- order_channel (retail|wholesale)
- wholesale_profile_id nullable
- quote_id nullable
- downpayment_required_amount
- downpayment_paid_amount
- downpayment_policy_snapshot (text/json)

## 6) API Requirements (Proposed)

- POST /api/wholesale/applications
- GET /api/wholesale/applications/my
- GET /api/admin/wholesale/applications
- PUT /api/admin/wholesale/applications/:id/status
- POST /api/wholesale/quotes
- GET /api/wholesale/quotes/:id
- PUT /api/admin/wholesale/quotes/:id/review
- POST /api/wholesale/quotes/:id/confirm
- PUT /api/orders/:id/payment-status (reuse, with wholesale constraints)

Rules:
- Server computes and signs wholesale totals before confirmation.
- Any mismatch between client totals and server totals returns 400.

## 7) UI Requirements

Buyer-side:
- Wholesale application form page.
- Wholesale dashboard (application status, active quotes, order history).
- Quote detail with expiry countdown and terms acceptance.

Admin-side:
- Wholesale applications queue.
- Quote review panel (quantities, lead time, policy notes).
- Wholesale order monitoring tab (payment, reservation, shipment readiness).

## 8) Security and Validation

- Role-based access for wholesale admin endpoints.
- Strict payload validation (quantities, prices, status transitions).
- No direct client authority over discount totals.
- Sensitive policy edits require super-admin session.

## 9) Reporting Requirements

Minimum KPIs:
- wholesale GMV
- approved vs rejected applications
- conversion rate (quote to order)
- average approval turnaround time
- outstanding downpayment balances

## 10) Implementation Sequence Recommendation

1. DB migration for wholesale core tables and order extensions.
2. Backend wholesale application + quote endpoints.
3. Server-side wholesale pricing engine.
4. Admin review UI.
5. Buyer wholesale dashboard.
6. E2E tests and UAT checklist.

## 11) Current Baseline Risks (Observed)

- Wholesale discount currently originates from checkout client logic.
- Backend currently accepts provided discount_amount without wholesale eligibility checks.
- No dedicated wholesale entities (profile/application/quote) in active schema.

This means wholesale must be treated as a controlled server-side module, not just a checkout discount toggle.

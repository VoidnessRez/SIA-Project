yes# System End-to-End Audit Report

Date: 2026-04-13
Scope: Todo #12
Environment: local backend at http://localhost:5174, frontend build validation

## 1) Build and Static Integrity

- Backend syntax check
  - `index.js`, `routes/orders.js`, `routes/upload.js`
  - Result: PASS
- Frontend production build
  - `npm run build`
  - Result: PASS
- Editor diagnostics on critical files
  - `orders.js`, `upload.js`, `main.jsx`, `Orders.jsx`, `Checkout.jsx`
  - Result: PASS

## 2) Runtime API Audit Matrix

### A. Health and Core Reachability
- GET `/api/health`
- Expected: status ok
- Result: PASS (`HEALTH=ok`)

### B. Order Creation Rules
- Created COD pickup order
  - Expected: `order_status=confirmed`
  - Result: PASS
- Created GCash pickup order
  - Expected: `order_status=pending_approval`
  - Result: PASS

### C. Payment Proof Upload Rules
- Upload proof to COD order
  - Expected: reject (GCash-only)
  - Result: PASS (`HTTP 400`)
- Upload proof to GCash order
  - Expected: success
  - Result: PASS (`HTTP 200`)

### D. Payment Verification Rules
- Mark paid without proof (GCash)
  - Expected: reject
  - Result: PASS (`HTTP 400`)
- Mark paid with proof (GCash)
  - Expected: `payment_status=paid`, `order_status=confirmed`
  - Result: PASS

### E. Non-Refundable Downpayment Policy
- Attempt `payment_status=refunded` on GCash paid order
  - Expected: blocked
  - Result: PASS (`HTTP 400`)
- Buyer cancels paid GCash order
  - Expected: stays `payment_status=paid`, order goes `buyer_cancelled`
  - Result: PASS
- Final note contains policy text
  - Expected: admin notes include non-refundable statement
  - Result: PASS

## 3) Legal Pages and Route Wiring

- Route registration in app router:
  - `/terms` present
  - `/privacy` present
- Checkout terms links:
  - links to `/terms` and `/privacy` present
- Frontend build with legal pages included:
  - PASS

## 4) Audit Verdict

Overall: PASS

No blocking regressions detected in audited critical paths.

## 5) Residual Risks / Next Task Inputs

- Wholesale discount is still client-originated in current implementation and not server-enforced.
- Order list endpoint still returns all orders; user filtering is currently done on client side.
- Next priorities:
  1. DB migrations and seed updates for wholesale and policy hardening.
  2. Automated tests and UAT checklist to convert this manual audit into repeatable validation.

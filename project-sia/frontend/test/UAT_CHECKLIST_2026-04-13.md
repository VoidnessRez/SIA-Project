# UAT Checklist (Release Validation)

Date: 2026-04-13
Scope: Todo #14

## 1) Checkout and Order Creation

- [ ] Retail COD pickup order can be created successfully.
- [ ] GCash pickup order starts in pending approval state.
- [ ] Checkout requires terms acceptance before placing order.
- [ ] Terms and Privacy links open correctly from checkout.

## 2) GCash Receipt and Verification Flow

- [ ] Buyer can upload receipt only for GCash orders.
- [ ] Receipt upload for non-GCash order is blocked.
- [ ] Admin can view uploaded receipt proof in customer order modal.
- [ ] Admin reject requires typed reason.
- [ ] Buyer reupload after reject requires typed reason.
- [ ] Reupload transitions order/payment back to pending approval/pending.

## 3) Payment Policy Controls

- [ ] Admin cannot mark paid if no GCash proof exists.
- [ ] Admin can mark paid when proof exists.
- [ ] Paid GCash cancellation keeps payment status as paid.
- [ ] Refunded status update is blocked for paid GCash.
- [ ] Policy note appears in admin notes after paid-GCash cancellation.

## 4) Order Status Lifecycle

- [ ] Buyer cancel moves status to buyer_cancelled.
- [ ] Admin decline moves status to declined_admin.
- [ ] Status labels in user/admin views match updated statuses.
- [ ] Stock restore runs on cancellation paths without breaking order update.

## 5) Legal and Compliance Pages

- [ ] /terms page loads and content is readable.
- [ ] /privacy page loads and content is readable.
- [ ] Terms page includes payment and non-refundable policy sections.
- [ ] Privacy page includes payment-proof data handling section.

## 6) Wholesale Baseline (Current Phase)

- [ ] Wholesale requirements document is available.
- [ ] Wholesale migration SQL file is prepared.
- [ ] Wholesale seed command exists and dry-run executes.
- [ ] Team confirms migration is applied in Supabase before wholesale runtime tests.

## 7) Technical Regression Checks

- [ ] Backend starts without route errors.
- [ ] Frontend production build succeeds.
- [ ] Core scripted E2E check passes (`npm run test:e2e:core`).
- [ ] No new editor diagnostics on touched core files.

## Sign-Off

- QA Name: ____________________
- Date: ____________________
- Result: [ ] PASS  [ ] FAIL
- Notes: _______________________________________________

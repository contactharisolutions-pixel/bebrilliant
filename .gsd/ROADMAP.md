---
milestone: v1.0 - Affiliate System
version: 1.0.0
updated: 2026-05-17T05:24:00Z
---

# Roadmap

> **Current Phase:** 1 - Database Schema & KYC Gates
> **Status:** planning

## Must-Haves (from SPEC)

- [ ] Secure Affiliate Teacher Signup and KYC details upload/storage.
- [ ] Admin approval gates and status updates.
- [ ] Unique referral URL generation for Exams.
- [ ] Referral credit balance applied during Student exam checkouts.
- [ ] Wallet balances, Ledgers, and Owner Payout Console.

---

## Phases

### Phase 1: Database Schema & KYC Gates
**Status:** ⬜ Not Started
**Objective:** Deliver tables for wallets, credits, KYC documents, ledgers, and the tenant-admin KYC verification view.
**Requirements:** REQ-01, REQ-02, REQ-03

**Plans:**
- [ ] Plan 1.1: Design and deploy database migrations for affiliate tables and triggers
- [ ] Plan 1.2: Build KYC registration form for Teachers
- [ ] Plan 1.3: Develop Tenant Admin verification portal and RLS secure upload folders

---

### Phase 2: Affiliate Teacher Dashboard & Link Generator
**Status:** ⬜ Not Started
**Objective:** Deliver unique referral link generator, dashboard for referred purchases, commission calculator, and wallet overview.
**Depends on:** Phase 1
**Requirements:** REQ-04, REQ-05

**Plans:**
- [ ] Plan 2.1: Design unique exam referral code encoder/decoder and UI actions
- [ ] Plan 2.2: Implement real-time referred sales analytics and wallet charts

---

### Phase 3: Student Referral Credits & Checkout Integration
**Status:** ⬜ Not Started
**Objective:** Provide students with unique codes, enable promotional credit balance calculations, and integrate automatic coupon/credit deductions in Razorpay checkout page.
**Depends on:** Phase 2
**Requirements:** REQ-06, REQ-07

**Plans:**
- [ ] Plan 3.1: Build Student Referral UI and active promo rewards panel
- [ ] Plan 3.2: Integrate Razorpay payment flow to automatically deduct referred credit balance

---

### Phase 4: Owner Console, Payout Ledger & Admin Gateways
**Status:** ⬜ Not Started
**Objective:** Deploy Global Platform Settings, Wallet Ledger hash verification triggers, TDS calculations, and manual bank transfer settlement gates.
**Depends on:** Phase 3
**Requirements:** REQ-08, REQ-09, REQ-10

**Plans:**
- [ ] Plan 4.1: Deploy Owner Administration portal with global settings overrides
- [ ] Plan 4.2: Build wallet payout settlement workflows and hash ledger validation

---

## Progress Summary

| Phase | Status | Plans | Complete |
|-------|--------|-------|----------|
| 1 | ⬜ | 0/3 | — |
| 2 | ⬜ | 0/2 | — |
| 3 | ⬜ | 0/2 | — |
| 4 | ⬜ | 0/2 | — |

---

## Timeline

| Phase | Started | Completed | Duration |
|-------|---------|-----------|----------|
| 1 | — | — | — |
| 2 | — | — | — |
| 3 | — | — | — |
| 4 | — | — | — |

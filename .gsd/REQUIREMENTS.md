---
milestone: v1.0 - Affiliate System
updated: 2026-05-17T05:23:54Z
---

# Requirements

## Overview

Requirements derived from SPEC.md for traceability and coverage tracking.

---

## Functional Requirements

| ID | Requirement | Source | Phase | Status |
|----|-------------|--------|-------|--------|
| REQ-01 | Register Affiliate Teacher with name, mobile, email, and bank details | SPEC Goal 1 | 1 | Pending |
| REQ-02 | Allow KYC documents upload (PAN, Aadhar, Bank proof) for Affiliate Teachers | SPEC Goal 1 | 1 | Pending |
| REQ-03 | Tenant Admin can approve/reject KYC requests and activate accounts | SPEC Goal 1 | 1 | Pending |
| REQ-04 | Affiliate Teacher can generate unique exam referral links and view reports | SPEC Goal 2 | 2 | Pending |
| REQ-05 | System credits referred exam checkouts to Affiliate Teacher's Wallet | SPEC Goal 2 | 2 | Pending |
| REQ-06 | Students can generate referral links and earn non-withdrawable credits | SPEC Goal 3 | 3 | Pending |
| REQ-07 | System prioritizes Student credit usage during registration fee checkout | SPEC Goal 3 | 3 | Pending |
| REQ-08 | System Owner can configure reward rates (flat or percentage) and TDS | SPEC Goal 4 | 4 | Pending |
| REQ-09 | System Owner can review, approve, and record manual bank payout steps | SPEC Goal 4 | 4 | Pending |
| REQ-10 | Transaction ledger ledger logs all wallet adjustments with security hashes | SPEC Goal 5 | 4 | Pending |

---

## Non-Functional Requirements

| ID | Requirement | Category | Phase | Status |
|----|-------------|----------|-------|--------|
| NFR-01 | Database mutations use strict triggers to prevent double-spending | Security | All | Pending |
| NFR-02 | User identity cached in Context, page transitions occur < 100ms | Performance | All | Pending |
| NFR-03 | Fully compliant with Next.js 15 routing parameters | Compatibility | All | Pending |

---

## Constraints

| ID | Constraint | Source | Impact |
|----|------------|--------|--------|
| CON-01 | Only Institute tenants can use Affiliate programs | Business Logic | Onboarding views, signups |
| CON-02 | All commission payments route strictly through Platform Owner account | Finance | Razorpay checkout flow |

---

## Traceability Matrix

| Requirement | Plans | Tests | Status |
|-------------|-------|-------|--------|
| REQ-01 | 1.1 | TC-REQ-01 | Pending |
| REQ-02 | 1.2 | TC-REQ-02 | Pending |
| REQ-03 | 1.3 | TC-REQ-03 | Pending |
| REQ-04 | 2.1 | TC-REQ-04 | Pending |
| REQ-05 | 2.2 | TC-REQ-05 | Pending |
| REQ-06 | 3.1 | TC-REQ-06 | Pending |
| REQ-07 | 3.2 | TC-REQ-07 | Pending |
| REQ-08 | 4.1 | TC-REQ-08 | Pending |
| REQ-09 | 4.2 | TC-REQ-09 | Pending |
| REQ-10 | 4.3 | TC-REQ-10 | Pending |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| Pending | Not yet started |
| In Progress | Being implemented |
| Complete | Implemented and verified |
| Blocked | Cannot proceed |
| Deferred | Moved to later milestone |

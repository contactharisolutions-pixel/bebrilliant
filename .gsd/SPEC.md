# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
BeBrilliant is expanding its educational multi-tenant platform with a premium, secure Affiliate system. The affiliate program leverages an **Owner-First Payment Model** where the primary platform owner collects all exam payments first, dynamically calculating and distributing affiliate wallets/rewards to referred teachers (Institute only) and students, promoting growth while maintaining complete financial safety, TDS compliance, and robust KYC approval gates.

## Goals
1. **Affiliate Teacher Onboarding & KYC**: Allow institute tenant admins to onboard affiliate teachers with details including PAN, Aadhaar, Bank Details, and an approval gate.
2. **Referral Link Generator & Wallet**: Enable affiliate teachers to share unique exam referral links, track referred exam purchases, and accrue rewards in a withdrawable wallet.
3. **Affiliate Student Credits**: Empower institute students to refer exams, earning non-withdrawable promotional credits applicable for future exam fees.
4. **Owner Administrative Console**: Provide the system owner with controls to set flat or percentage rewards, configure TDS rates, view transaction distributions, and approve withdrawal requests.
5. **Security & Financial Integrity**: Maintain database-level tenant isolation, audit records of all reward allocations, and prevent unauthorized cash withdrawals or double-spending.

## Non-Goals (Out of Scope)
- Automatic bank payout execution (e.g., immediate API-based wire transfers; payouts are marked manually after manual bank routing).
- Multi-level referral tiers beyond Level 2 overrides.
- Referral programs for Schools or Independent Teachers (Affiliates are exclusive to Institutes).

## Users
- **System Owner**: Configures global reward metrics, monitors platform financial flow, processes withdrawal payouts, and manages security overrides.
- **Tenant Admin (Institute)**: Invites and approves affiliate teachers, verifies KYC documents, monitors affiliate sales metrics, and handles local settings.
- **Affiliate Teacher**: Generates referral links for exams, monitors referred sales, reviews earnings history, uploads KYC data, and files withdrawal requests.
- **Student**: Generates referral codes, shares them with peers, and accumulates exam credits to deduct from their own registration fees.

## Constraints
- **Next.js 15 & React 19 Alignment**: All code must conform to the specific server action and app router rules detailed in `AGENTS.md`.
- **Database Engine**: Strictly utilize Supabase RLS and direct schema triggers to calculate commissions and prevent race conditions.
- **No Tailwind CSS v3 Utilities**: Align all styles with the Tailwind CSS v4 directives inside `globals.css` or vanilla styling overrides.

## Success Criteria
- [ ] Successful registration, KYC upload, and manual activation of an Affiliate Teacher.
- [ ] Automated ledger entry generation in the database upon successful Razorpay exam checkout by a referred student.
- [ ] Automatic fee deduction using Affiliate Student credits during checkout.
- [ ] Safe withdrawal processing for an Affiliate Teacher showing correct TDS deductions and updated wallet ledger states.

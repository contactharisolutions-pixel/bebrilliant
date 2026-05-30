# DECISIONS.md — Architecture Decision Records

> **Purpose**: Log significant technical decisions and their rationale.

---

## Decisions

## [DECISION-001] Owner-First Payment Model with Ledger Database Triggers

**Date**: 2026-05-17
**Status**: Accepted

### Context
To build a sustainable multi-tenant affiliate system for BeBrilliant, we need to handle payment distribution. Direct payouts (split payments via payment gateway APIs) introduces substantial financial risk, chargeback complexities, compliance/tax challenges, and increased API dependency.

### Decision
Implement an "Owner-First" payment model. The platform owner receives the full payment on exam checkout. Database-level ledger triggers dynamically calculate commission rates, deduct platform fees, calculate TDS, and credit the balance to local tenant/affiliate wallets. Teachers request withdrawals, which are approved and settled manually by the platform owner.

### Rationale
- **Financial Control**: Platform owner verifies the entire balance and resolves refunds before distributing funds outside the platform ecosystem.
- **TDS Compliance**: Platforms can dynamically calculate TDS deductions at payout time, keeping local records perfectly synchronized.
- **Simplicity**: No complex dynamic routing API configurations or extra payment gateway overhead.

### Consequences
- **Manual Workload**: Platform owner must review and process teacher payout requests manually (uploading a bank receipt to confirm completion).
- **Security Dependency**: Database row-level security (RLS) must be absolute to prevent spoofing wallet balances.

### Alternatives Considered
- **Razorpay Route (Real-Time Splits)**: Rejected due to onboarding complexity for individual teachers, high fee structure, and chargeback risks.

---

*Last updated: 2026-05-17*

# Supabase Migration Plan

This document outlines the steps required to migrate the **BB-Revised** database from the current Supabase project to a new project/account.

## Current Project Details
- **Project Ref**: `bfzlkdurgggzytegvvrw`
- **Database URL**: `postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres`

## Prerequisites
1.  **Supabase CLI**: Installed on your local machine.
2.  **Access**: Access to both the source and target Supabase accounts.
3.  **New Project**: Create a new project in the target Supabase account and note its **Project Ref** and **Database Password**.

---

## Phase 1: Export Data and Schema

### 1.1 Login to Supabase CLI
```bash
npx supabase login
```

### 1.2 Link Source Project
Link to the current project (`bfzlkdurgggzytegvvrw`):
```bash
npx supabase link --project-ref bfzlkdurgggzytegvvrw
```

### 1.3 Dump Database
We will dump both the schema and the data.
> [!IMPORTANT]
> The schema is already largely available in `supabase/migrations`, but a full dump ensures nothing is missed (functions, triggers, extensions).

```bash
# Export Schema
npx supabase db dump --project-ref bfzlkdurgggzytegvvrw -f source_schema.sql

# Export Data Only
npx supabase db dump --project-ref bfzlkdurgggzytegvvrw --data-only -f source_data.sql
```

---

## Phase 2: Prepare Target Project

### 2.1 Link Target Project
Replace `<target-project-id>` with your new project's ID.
```bash
npx supabase link --project-ref <target-project-id>
```

### 2.2 Apply Migrations
If you want to use the existing migration files:
```bash
npx supabase db push
```
*Note: This will apply all SQL files in `supabase/migrations` to the new project.*

### 2.3 Import Data
Use `psql` to import the data dump.
```bash
psql -h db.<target-project-id>.supabase.co -U postgres -d postgres -f source_data.sql
```
*Note: You will be prompted for the database password you set during project creation.*

---

## Phase 3: Application Configuration

Once the database is migrated, you need to update the application's environment variables.

### Environment Variable Update
Update the following files with the new project credentials:
- `.env`
- `.env.local`

#### Keys to Update:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Phase 4: Migration Scripts

I have prepared a script to help you update the environment variables once you have the new keys.

### Update Script
Run this script after you have your new project keys:
`node scripts/migrate-env.mjs <NEW_URL> <NEW_ANON_KEY> <NEW_SERVICE_ROLE_KEY> <NEW_DB_URL>`

---

## Post-Migration Checklist
- [ ] Verify Authentication (try logging in).
- [ ] Verify Database Queries (check dashboard).
- [ ] Verify Storage (if using Supabase Storage, buckets need to be recreated/copied).
- [ ] Verify Edge Functions (if any).
- [ ] Update Vercel/Deployment environment variables.

# Dashboards and Reporting

## Purpose

Dashboards should make household finances understandable at a glance while supporting drill-down into owner-specific and category-specific details.

## Required Dashboards

The app should support dashboards for:

- Net worth
- Cash flow
- Spending by category
- Savings rate
- Budget variance
- Debt payoff
- Investment performance
- Income trends
- Tax-related summaries
- Month-over-month spending
- Year-over-year spending

## Dashboard Filters

Dashboards should support filtering by:

- Owner
- Account
- Account type
- Category
- Tags
- Date range
- Transaction type
- Budget group
- Tax relevance

## Ownership Views

Dashboards should support:

- Household total
- Owner 1
- Owner 2
- Joint
- Ownership-adjusted

## AI-Generated Charts

The app should eventually support AI-assisted chart generation.

Example user prompts:

```txt
Show me why spending was higher this month.
Compare our eating out trend over the last 12 months.
Show investment growth excluding retirement accounts.
Show our savings rate by owner.
```

AI-generated charts should be explainable and traceable back to source data.

## Current Route Map and Delivery Status

### Shared Dashboard Foundation (Implemented)

- Unified global filters (period/date range, owner, account, account type, category, tag, transaction type)
- Ownership views (household, owner 1, owner 2, joint, ownership-adjusted)
- Reusable responsive chart cards (desktop grid + mobile stacked behavior)
- Common empty states and data-quality flags (uncategorized, excluded, pending, duplicate, estimated, manual, sync-needed)
- Drill-down contract on chart points via transaction/account/loan/holding identifiers

### Phase 1 Routes (Implemented)

- `/dashboard/overview`
  - Net worth snapshot + trend
  - Monthly cash flow
  - Spending by category
  - Savings rate KPI
  - Debt balance summary
  - Investment allocation
  - Alerts / review-needed
- `/dashboard/spending`
  - Spending by category
  - Category trend
  - MoM / YoY spending
  - Merchant spending
  - Tag spending
  - Daily burn / heatmap-style daily totals
  - Uncategorized spending review
- `/dashboard/net-worth`
  - Net worth over time
  - Assets vs liabilities
  - Net worth breakdown
  - Ownership-adjusted net worth
  - Account, manual asset, and liability trends
- `/dashboard/budget`
  - Budget vs actual
  - Variance trend
  - Utilization
  - Overrun ranking
  - Remaining budget burn-down
  - Flexible vs fixed split
- `/dashboard/loans`
  - Debt balance trend
  - Debt breakdown
  - Principal vs interest
  - Payoff timeline
  - Interest cost projection
  - Extra payment impact
  - Debt strategy comparison
  - Debt-to-assets ratio

### Phase 2 Routes (Deferred Shells Added)

- `/dashboard/investments`
- `/dashboard/income`
- `/dashboard/taxes`
- `/dashboard/planning`
- `/dashboard/review`

These routes are intentionally staged after phase 1 and currently provide shell pages that define the planned chart sets.

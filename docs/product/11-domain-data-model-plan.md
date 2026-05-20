# Domain and Data Model Plan

## Purpose

Define the initial domain model planning view for the personal finance app, including entities, aggregates, relationships, and value objects.

This document is planning-only. It does not prescribe implementation details, database tables, framework choices, or code structure.

## Core Aggregates

### Household

Primary boundary for financial data.

Contains or relates to:

- Owners
- Accounts
- Budgets
- Planning scenarios
- Reporting settings

### Owner

Represents configurable attribution identities, not necessarily authenticated users.

Examples:

- Owner 1
- Owner 2
- Joint / Household

Key relationships:

- Used by ownership allocations
- Used for dashboard and report filtering
- May later map to authenticated users

### Account

Aggregate for linked or manual financial accounts.

Includes:

- Account metadata
- Account type and subtype
- Institution and linked connection metadata
- Balance history
- Ownership configuration
- Inclusion and exclusion flags for net worth, budgeting, and tax planning

Relationships:

- Belongs to a household
- May be linked to an institution and external connection
- Has many transactions
- Has many balance snapshots
- Has ownership allocation history

### Transaction

Aggregate for imported or manual transaction activity.

Includes:

- Amount, date, description, and merchant information
- Type, category, subcategory, and optional sub-subcategory
- Tags
- Ownership override
- Manual override state
- Rule application history
- Splits

Relationships:

- Belongs to an account
- May have many transaction splits
- May be affected by categorization rules
- May have manual overrides
- May be used by budgets, dashboards, tax summaries, and AI summaries

### Categorization Rule

Aggregate for user-defined transaction classification logic.

Includes:

- Conditions
- Actions
- Priority
- Active or inactive state
- Conflict visibility
- Rule application results

Relationships:

- Evaluates transactions
- Produces rule matches or rule applications
- May modify classification, tags, merchant normalization, ownership, budget treatment, or tax treatment

### Budget

Aggregate for planned spending and income tracking.

Includes:

- Budget period
- Budget groups or categories
- Owner scope
- Included transaction filters
- Variance calculations

Relationships:

- Uses transactions
- Uses categories and tags
- May be owner-filtered

### Planning Scenario

Aggregate for what-if projections.

Includes:

- Scenario type
- Assumptions
- Inputs
- Outputs
- Owner allocation
- Projection metadata and disclaimers

Relationships:

- Belongs to a household
- May reference accounts, loans, investments, or saved assumption profiles

## Supporting Entities

### Institution

Represents financial institutions for linked accounts.

### External Connection

Represents Plaid or similar provider connection health and metadata.

### Balance Snapshot

Historical account balance record.

### Transaction Split

Child entity of a transaction.

Includes:

- Fixed amount or percentage
- Category classification
- Tags
- Ownership allocation
- Tax treatment
- Budget treatment

### Category

Hierarchical classification entity.

Suggested hierarchy:

- Transaction type
- Category
- Subcategory
- Sub-subcategory

### Tag

Flexible label used for filtering, reporting, and rules.

### Rule Match / Rule Application

Records which rules matched a transaction, which rule won, why it won, and what changed.

### Manual Override

Records user-preserved edits to transactions or classifications.

### Ownership Change Event

Tracks historical ownership changes, including point-in-time and retrofit behavior.

### Assumption Profile

Reusable market, rate, tax, and inflation assumptions for planning scenarios.

### Audit Event

Records important user-driven changes, including:

- Manual categorization changes
- Rule changes
- Ownership changes
- Historical retrofits
- Transaction splits
- Budget changes

## Value Objects

### Money

Amount plus currency.

### Percentage

Used for ownership allocation, split allocation, tax rates, interest rates, and similar proportional values.

### Date Range

Used for reports, rules, dashboards, and scenarios.

### Ownership Allocation

Percentage allocation across owners or joint buckets.

### Account Type

Checking, savings, credit card, brokerage, retirement, mortgage, loan, manual asset, or manual liability.

### Transaction Classification

Type, category, subcategory, and optional sub-subcategory.

### Merchant Identity

Raw merchant, normalized merchant, and description metadata.

### Rule Condition

Criteria such as merchant, amount, account, date range, category, ownership, and tags.

### Rule Action

Changes made by a rule.

### Budget Treatment

Included, excluded, or special handling for budgeting.

### Tax Treatment

Tax relevance and classification metadata.

### Scenario Assumptions

Expected return, interest rate, tax rate, inflation, risk preference, and time horizon.

### Inclusion Flags

Include or exclude from net worth, budgeting, and tax planning.

## Key Relationships

- Household has many owners.
- Household has many accounts.
- Account has many transactions.
- Account has many balance snapshots.
- Account has ownership allocation history.
- Transaction belongs to an account.
- Transaction may override account ownership.
- Transaction may have many splits.
- Split may have its own ownership allocation.
- Transaction may have many tags.
- Transaction has one classification.
- Categorization rule may match many transactions.
- Transaction may have many rule applications.
- Manual override protects user edits from future rules.
- Budget consumes classified and filtered transactions.
- Dashboards and reports query accounts, transactions, balances, categories, tags, owners, and budgets.
- Planning scenario uses accounts, assumptions, ownership allocation, and scenario inputs.
- Audit events track important user-driven domain changes.

## Suggested Aggregate Boundaries

Keep these as separate aggregate roots:

- Household
- Owner
- Account
- Transaction
- Categorization Rule
- Budget
- Planning Scenario
- Assumption Profile

Keep these as child entities or value objects:

- Transaction Split under Transaction
- Balance Snapshot under Account or as separate time-series data
- Ownership Allocation as a value object
- Classification as a value object or controlled taxonomy reference
- Rule Condition and Rule Action under Categorization Rule
- Rule Application under Transaction or as a separate audit/query entity
- Audit Event as an append-only supporting entity

## Open Modeling Decisions

- Whether Owner and User remain separate permanently or User eventually owns Owner profiles.
- Whether categories are user-configurable or a seeded system taxonomy with user extensions.
- Whether Balance Snapshot is part of the Account aggregate or independent historical data.
- Whether Transaction Split should preserve the original transaction total immutably.
- How historical ownership retrofits are represented without mutating original source data.
- Whether reports use materialized ownership-adjusted views or compute ownership adjustments on demand.

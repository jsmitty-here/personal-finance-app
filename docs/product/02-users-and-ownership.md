# Users, Owners, and Ownership

## Purpose

The app must support financial reporting for a household while preserving clear ownership boundaries between two people and jointly owned finances.

## Owners

The app must support configurable owner aliases.

Example:

- Owner 1: Justin
- Owner 2: Spouse
- Joint / Household

The system should not hardcode owner names.

## Ownership Levels

Ownership must be supported at multiple levels:

1. Account-level ownership
2. Account-level percentage allocation
3. Transaction-level ownership override
4. Split-level ownership allocation

## Ownership Types

Accounts and transactions may be treated as:

- 100% Owner 1
- 100% Owner 2
- 100% Joint
- Percentage allocated between owners
- Custom split

Example:

A joint credit card may be treated as:

- 50% Owner 1
- 50% Owner 2

Or:

- 70% Owner 1
- 30% Owner 2

## Ownership Effects

Ownership allocation must affect:

- Spending reports
- Budgeting
- Net worth
- Savings rate
- Tax analysis
- Retirement planning
- What-if scenarios
- AI-generated financial summaries

## Historical Ownership

Ownership changes must support two modes:

### Point-in-Time Change

The new ownership model applies only from a selected effective date forward.

### Historical Retrofit

The new ownership model is applied retroactively to historical data.

## Reporting Requirement

All dashboards and reports should support owner filtering:

- Household total
- Owner 1
- Owner 2
- Joint
- Ownership-adjusted view


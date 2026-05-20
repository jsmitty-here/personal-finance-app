# Project Structure

## Repository Layout

```
/apps
  /Finance.Api              # ASP.NET Core API — vertical slices, EF Core, auth, background jobs, integrations
/web
  /Finance.Web              # React + TypeScript + shadcn/ui PWA
/aspire
  /Finance.AppHost          # .NET Aspire orchestration host
  /Finance.ServiceDefaults  # Shared Aspire service defaults
/tests
  /Finance.Tests            # Unit + integration tests (Testcontainers)
/docs
  /product                  # Vision, requirements, domain glossary
  /architecture             # Structure, decisions, diagrams
  /decisions                # Architecture Decision Records (ADRs)
  /agent-prompts            # Reusable prompts for AI coding agents
```

## Backend: Finance.Api

One backend project. Split only if a strong reason emerges.

```
/apps/Finance.Api
  /Features
    /Accounts
    /Transactions
    /Rules
    /Budgets
    /Dashboards
    /Planning
    /Investments
    /Loans
    /Ai
  /Domain
    /Ownership
    /Categorization
    /Transactions
    /Rules
    /Planning
  /Infrastructure
    /Persistence
    /Plaid
    /MarketData
    /Ai
    /Security
  /Common
    /Results
    /Validation
    /Money
    /Dates
```

## Vertical Slice Convention

Features are the primary unit of organization. Each slice owns its full stack from endpoint to handler.

**Example — `SplitTransaction` slice:**

```
/Features/Transactions/SplitTransaction
  SplitTransactionEndpoint.cs
  SplitTransactionRequest.cs
  SplitTransactionResponse.cs
  SplitTransactionHandler.cs
  SplitTransactionValidator.cs
  SplitTransactionTests.cs
```

## When to Extract into /Domain

Move logic out of a slice and into `/Domain` only when it meets one or more of these criteria:

- Reused by multiple feature slices
- Financially critical (correctness must be independently verified)
- Complex enough to warrant isolated unit tests
- Likely to outlive a single workflow or feature

Default to keeping logic in the slice. Extract only when earned.

## Agent Task Shape

Each agent task should target one feature folder.

**Good prompt shape:**

```
Implement /Features/Rules/PreviewRuleImpact.
Do not modify unrelated feature folders.
Use existing domain helpers if present.
Add unit/integration tests in the same feature area.
```

## Design Rationale

Single backend project + vertical slices + extracted domain only when earned.

Benefits:
- Less project sprawl
- Faster agent navigation
- Fewer abstractions
- Easier refactors
- Enough structure for correctness

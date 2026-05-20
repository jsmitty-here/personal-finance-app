# Transactions, Categorization, and Rules

## Purpose

Transaction categorization is a critical usability requirement.

The system must make it easy to:

- Review transactions
- Categorize transactions
- Recharacterize transactions
- Create rules
- Split transactions
- Resolve rule conflicts
- Preserve manual overrides

## Categorization Model

Each transaction should support:

- Type
- Category
- Subcategory
- Optional sub-subcategory
- Tags

Default subcategory should be allowed.

Example:

```txt
Type: Expense
Category: Food
Subcategory: Groceries
SubSubcategory: Other
Tags: [Household, Costco]
```

## Transaction Types

Transaction types should include at least:

- Income
- Expense
- Transfer
- Investment activity
- Loan payment
- Fee
- Tax
- Refund
- Reimbursement
- Adjustment

## Rules

Rules should be able to evaluate:

- Merchant
- Normalized merchant
- Transaction description
- Amount
- Account
- Date range
- Transaction type
- Existing category
- Ownership
- Tags

## Rule Actions

Rules should be able to set or modify:

- Type
- Category
- Subcategory
- Sub-subcategory
- Tags
- Merchant normalization
- Ownership allocation
- Budget treatment
- Tax treatment

## Rule Priority

Rules must be priority-based.

When multiple rules match, the system should expose conflict resolution clearly to the user.

The user should be able to see:

- Which rules matched
- Which rule won
- Why it won
- What fields were changed
- Whether the transaction was manually overridden

## Manual Overrides

Manual transaction edits should be preserved and should not be silently overwritten by future rules.

## Transaction Splitting

Transactions must support splitting by:

- Fixed amount
- Percentage

Each split should support its own:

- Category
- Subcategory
- Tags
- Ownership allocation
- Tax treatment
- Budget treatment

Example:

A $200 Costco transaction may be split into:

- $120 Groceries
- $50 Household Supplies
- $30 Personal Spending


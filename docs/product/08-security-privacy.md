# Security and Privacy Requirements

## Purpose

Financial data is sensitive. The app should be designed with privacy and security as first-class requirements even if it is initially personal-use only.

## Authentication

The app should include authentication scaffolding from the beginning.
The system should be designed so that future user-specific access control is possible.

## Authorization

The app should support clean filtering by owner/user even if the initial household is small.

## Encryption

Encryption at rest should be supported if practical.

Sensitive values may include:

- Access tokens
- Account identifiers
- Transaction data
- Balances
- Personally identifiable financial metadata

## Data Privacy

The app should avoid sending sensitive financial data to external AI services by default.

## Auditability

The app should preserve important user-driven changes, including:

- Manual categorization changes
- Rule changes
- Ownership changes
- Historical retrofits
- Transaction splits
- Budget changes


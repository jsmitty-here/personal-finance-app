# Personal Finance App

Personal Finance App is a household-focused finance platform plan for tracking, understanding, and optimizing finances across linked and manual accounts.

## Current Status

This repository is currently in the **planning/specification phase**.  
The primary source of truth is in `/docs`, with product and architecture documentation defining scope and requirements for implementation.

## Product Goals

The app is designed to provide:

- Unified household financial visibility
- Ownership-aware reporting (individual, joint, and adjusted views)
- High-accuracy transaction categorization with manual overrides
- Dashboards for net worth, spending, cash flow, budgeting, debt, and investments
- What-if planning scenarios
- Privacy-first local AI/LLM-assisted analysis

Out of scope for v1 includes money movement, bill payment, and securities trading.

## Repository Layout (Current)

```txt
/
├── README.md
└── docs/
    ├── CONTRIBUTING.md
    ├── architecture/
    │   └── project-structure.md
    └── product/
        ├── 00-vision.md
        ├── 01-scope.md
        ├── 02-users-and-ownership.md
        ├── 03-account-data.md
        ├── 04-transactions-categorization-rules.md
        ├── 05-dashboards-reporting.md
        ├── 06-planning-scenarios.md
        ├── 07-ai-local-llm.md
        ├── 08-security-privacy.md
        ├── 09-v1-requirements.md
        ├── 10-domain-glossary.md
        └── 11-domain-data-model-plan.md
```

## Start Here

1. Read the product vision: `/docs/product/00-vision.md`
2. Review scope and v1 requirements:
   - `/docs/product/01-scope.md`
   - `/docs/product/09-v1-requirements.md`
3. Review ownership and reporting model:
   - `/docs/product/02-users-and-ownership.md`
4. Review domain definitions:
   - `/docs/product/10-domain-glossary.md`
   - `/docs/product/11-domain-data-model-plan.md`
5. Read contribution guidance: `/docs/CONTRIBUTING.md`

## Contributing

Please follow `/docs/CONTRIBUTING.md`.  
During this phase, contributions should focus on improving requirements, architecture, domain modeling, and edge-case coverage.

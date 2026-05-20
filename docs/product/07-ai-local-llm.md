# Local AI / LLM Requirements

## Purpose

The app should support private AI-assisted financial analysis using a local LLM assumption for v1.

## Primary AI Use Cases

The AI assistant should be able to answer questions such as:

```txt
Why did our spending increase this month?
How much did we spend on restaurants last quarter?
Which categories are trending upward?
What transactions should I review?
What rules should I create?
Are we saving enough?
Should we put extra cash toward loans or investments?
```

## AI Constraints

The AI system should:

- Prefer local/private execution.
- Avoid sending raw financial data to hosted APIs by default.
- Explain which data it used.
- Avoid making unsupported financial claims.
- Distinguish facts from projections.
- Allow the user to inspect source transactions behind answers.

## AI Capabilities

The AI should eventually support:

- Natural language financial Q&A
- Spending explanations
- Categorization suggestions
- Rule suggestions
- Anomaly detection
- Monthly summaries
- Dynamic chart suggestions
- Planning scenario explanations


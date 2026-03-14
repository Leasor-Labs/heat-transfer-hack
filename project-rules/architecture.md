# Architecture Rules

## Allowed repo structure
- `src/pages` = route-level pages
- `src/components` = reusable UI components
- `src/lib/calculations` = formulas and estimation logic
- `src/lib/scoring` = feasibility score logic only
- `src/api` = API handlers
- `src/data` = seed data and data utilities
- `src/lib/integration` = API integration and orchestration
- `shared` = shared contracts, constants, and types
- `project-rules` = glossary, instructions, and ownership rules

## Naming conventions
- React components use PascalCase
- Functions and variables use camelCase
- Type names use PascalCase
- File names should be descriptive and consistent
- Avoid duplicate utility files with overlapping purposes

## Core application flow
1. Identify Heat Sources
2. Identify Heat Consumers
3. Calculate distance between source and consumer
4. Estimate Waste Heat
5. Estimate Recoverable Heat
6. Estimate Infrastructure Cost
7. Estimate Annual Energy Savings
8. Estimate Emissions Reduction
9. Generate Feasibility Score
10. Rank Opportunities

## Non-negotiable rules
- The Feasibility Score is generated after the financial model executes
- Shared field names must match `shared/types.ts`
- API response shapes must match `shared/api-contract.ts`
- New metrics must be added to shared contracts before UI or backend usage

# File Ownership

## Frontend Owner
Owns:
- `src/pages/*`
- `src/components/*`
- `src/styles/*`

May edit:
- UI presentation
- map visualization
- cards, charts, and layout

May not edit without approval:
- `shared/types.ts`
- `shared/api-contract.ts`
- backend scoring logic
- deployment config

## Backend / Calculation Owner
Owns:
- `src/api/*`
- `src/lib/calculations/*`
- `src/lib/scoring/*`

May edit:
- waste heat estimation
- recoverable heat calculations
- infrastructure cost calculations
- annual savings
- emissions reduction
- feasibility score logic

May not edit without approval:
- frontend UI files
- shared contracts
- deployment config

## Data / Integration Owner
Owns:
- `src/data/*`
- `src/lib/integration/*`
- `shared/*`
- project config and environment setup

May edit:
- shared types
- constants
- API contracts
- seed data
- integration logic
- config

## Merge rules
- No one commits directly to `main`
- Shared files require careful review before merge
- `shared/*` is a controlled area
- `package.json` should have a single owner during the hackathon
- If two tasks touch the same file, coordinate before coding

## Shared files treated as high-risk
- `shared/types.ts`
- `shared/constants.ts`
- `shared/api-contract.ts`
- `package.json`
- deployment config
- environment variable files

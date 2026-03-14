# Agent Rules

You are working in a shared repo with multiple developers and agents.

## Required startup steps
Before making any code changes:
1. Read all files in `/project-rules`
2. Read `/shared/types.ts`
3. Read `/shared/api-contract.ts`
4. Follow the terminology in `/project-rules/glossary.md`
5. Respect file ownership in `/project-rules/file-ownership.md`

## Hard rules
- Do not invent new terminology for core concepts
- Do not create new top-level folders
- Do not rename shared fields without updating the shared contract files first
- Do not modify files outside the task scope
- Do not move files unless explicitly instructed
- Do not refactor unrelated code
- Do not edit `package.json`, environment files, or deployment config unless explicitly assigned

## Core project terms
Use these exact terms:
- Heat Source
- Heat Consumer
- Heat Exchange Opportunity
- Recoverable Heat
- Infrastructure Cost
- Annual Energy Savings
- Emissions Reduction
- Feasibility Score

## Implementation rules
- Use shared types from `/shared/types.ts`
- Use constants from `/shared/constants.ts`
- Use API request/response shapes from `/shared/api-contract.ts`
- Keep changes minimal and scoped
- Preserve existing public interfaces unless instructed otherwise

## If you need a new field or term
If a required term, type, or field does not exist:
1. Propose the addition
2. Add it to the shared contract files first
3. Then implement usage consistently

## Output quality rules
- Prefer simple, readable code over clever abstractions
- Keep functions small and named clearly
- Add brief comments only where logic is not obvious
- Do not generate placeholder TODO logic unless requested

## Merge safety rules
- Only edit the files explicitly assigned
- Do not touch another teammate's owned area
- Keep diffs small
- Do not rewrite formatting across unrelated files

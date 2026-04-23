

## 2. `AGENTS.md`

```md
# AGENTS.md

## Project
This repository implements the MVP described in `docs/IMPLEMENTATION_HANDOFF.md`.

## Primary rule
Always follow the handoff document exactly.
Do not invent new product policy, UX policy, data policy, or classification policy.

## Scope control
- Implement only the scope explicitly requested in the current prompt.
- Do not expand scope on your own.
- Do not build future-phase features unless explicitly requested.
- Do not add authentication, multi-user support, export, admin UI, or AI recommendation features unless explicitly requested.

## Architecture rules
- Keep frontend and backend separated.
- Use React for frontend.
- Use FastAPI for backend.
- Use SQLite for runtime data storage.
- Use JSON files in `config/` for dictionary/config data.
- Keep the project runnable locally.

## Data and classification rules
- Follow the schema and field definitions in `docs/IMPLEMENTATION_HANDOFF.md`.
- Do not hardcode seed data into source code.
- Read dictionary/config data from JSON files.
- Respect the exact matching and alias matching policy defined in the handoff document.
- Do not add semantic inference beyond the documented MVP rules.

## Working style
- Make small, scoped changes.
- Prefer clear and maintainable code.
- Do not refactor unrelated areas.
- When a task is complete, summarize:
  - files created
  - files modified
  - how to run
  - how to verify

## Implementation order
1. SQLite initialization
2. schema creation
3. JSON config loader
4. postings API
5. review_items API
6. dashboard API
7. frontend skeleton
8. posting analysis page
9. review management page
10. dashboard integration

## Current exclusions
- login / signup
- permissions
- multi-user support
- export
- dictionary management UI
- active AI recommendation management
- advanced semantic automation
- automatic final category confirmation

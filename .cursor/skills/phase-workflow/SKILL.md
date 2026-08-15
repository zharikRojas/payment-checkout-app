---
name: phase-workflow
description: >
  Executes payment-checkout-app work strictly by the active phase in
  .cursor/sdd/03-fases.md. Use on ANY implementation, scaffold, test, deploy,
  or "siguiente fase" request. Also when the user mentions fase, phase, DoD,
  or scope of the current milestone.
---

# Phase workflow

## Before any code

1. Read `.cursor/sdd/03-fases.md` → identify **fase activa**.
2. Read matching decisions in `.cursor/sdd/01-requerimientos.md` and `.cursor/sdd/02-diseno-tecnico.md`.
3. Do **only** checklist items of that phase. Out of phase = skip (say so in one line).

## During work

- One micro-bloque at a time.
- After a micro-bloque: propose commit via `commit-gate` skill; wait for user OK.
- Keep PR target = `development` (never direct to `main` during the test). Feature branches: `feat|fix|chore|docs|test|security/...`.

## Closing a phase

- All DoD boxes for the phase must be true.
- Propose PR summary; do not merge without user OK.
- Update “Estado actual” in `.cursor/sdd/03-fases.md` (private file OK).

## Phase map (short)

0 Spec → 1 Foundation → 2 API domain+reserve → 3 Pay+webhook → 4 FE checkout → 5 ≥85%+OWASP → 6 AWS release

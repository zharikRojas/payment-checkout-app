# Agent notes (public)

Project rules live in `.cursor/rules/` (always-on + scoped).

Project skills live in `.cursor/skills/`:

| Skill | When |
|-------|------|
| `ponytail` | Any coding task (always) |
| `phase-workflow` | Implementation by phase |
| `owasp-top10` | Security / payments / headers |
| `commit-gate` | Before every commit |

Private specs (SRS/SDD/phases/statement) are in `.cursor/sdd/` and are **gitignored** — do not publish.

## Git branches
- `main` — release only (final merge from `development` → `main`)
- `development` — integration (ALL feature PRs target this)
- Feature branches: `feat/...`, `fix/...`, `chore/...`, `docs/...`, `test/...`, `security/...`

Upstream Ponytail: https://github.com/DietrichGebert/ponytail

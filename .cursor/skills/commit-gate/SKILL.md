---
name: commit-gate
description: >
  Proposes Conventional Commits for payment-checkout-app and waits for explicit
  user approval before running git commit. Use whenever work is ready to commit,
  when the user asks for a commit, or at the end of a phase micro-block. Never
  commit secrets or .cursor/sdd/.
---

# Commit gate

## Regla dura

**No ejecutar `git commit` hasta que el usuario apruebe** el mensaje (sí / OK / apruebo).

## Formato

```text
tipo(modulo): descripción en inglés imperativo corto
```

- **tipos:** feat, fix, docs, test, refactor, chore, security, ci, style, perf
- **modulos:** api, web, db, pay, repo, aws, docs
- Un commit = un micro-bloque revisable. No mezclar FE+BE salvo wiring mínimo.

## Plantilla a mostrar al usuario

```text
PROPUESTA DE COMMIT
tipo(modulo): descripción

Archivos:
- path1
- path2

Notas:
- (qué queda fuera / por qué este tipo)
```

## Tras aprobación

1. Stage solo esos archivos (nunca `.env`, nunca `.cursor/sdd/`).
2. Commit con HEREDOC.
3. Mostrar `git status` breve.

## Prohibido

- `--no-verify`, amend no pedido, push no pedido.
- Commits vacíos o dump de toda la fase en uno solo si hubo varios micro-bloques aprobables.

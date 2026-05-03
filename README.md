# Foresight Studio

A light-weight academic web tool for STEEP/PESTLE collaborative foresight in speculative-design classes. Students log signals, weave them into trends, share collections, and compose evidence-grounded scenarios. Instructors get a participation dashboard and CSV exports.

## Workspace layout

This is a [pnpm](https://pnpm.io/) monorepo. Each artifact lives under `artifacts/` and has its own dev workflow.

| Artifact | Purpose |
| --- | --- |
| `artifacts/api-server` | Express 5 API, flat-file JSON storage, session auth |
| `artifacts/foresight` | React + Vite student / instructor web app |
| `artifacts/mockup-sandbox` | Vite preview sandbox for component variants |

Shared libraries live under `lib/` and the OpenAPI codegen pipeline is in `scripts/`.

## Quick start

```bash
pnpm install
pnpm run typecheck      # full workspace typecheck
pnpm run build          # typecheck + build all packages

# run individual services
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/foresight run dev
```

The instructor passcode is seeded as `foresight2026` and an 8-student roster is generated on first run.

## Validation gates

These are enforced server-side on every mutation path (create, update, status flip, source delete):

- A **submitted signal** must have at least one source.
- A **trend** must reference at least `config.trendMinSignals` signals (default 2).
- A **submitted scenario** must reference at least `config.scenarioMinSignals` signals (default 5).

Thresholds are configurable from `/instructor/settings`.

## CI

Workflow templates live in [`docs/github-workflows/`](docs/github-workflows/) and need to be copied into `.github/workflows/` once (the Replit GitHub OAuth app does not have `workflow` scope, so they could not be pushed automatically). They run typecheck + build and a Prettier check on every push and PR to `main`.

## License

MIT

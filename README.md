# @pubfunc/node-utils

Monorepo of small utility libraries published to npm under the `@pubfunc/*` scope.

## Packages

- [`@pubfunc/node-env`](./packages/node-env): Type-safe `process.env` wrapper (`Env<TKey>`).

## Development

### Prerequisites

- Node.js (via `nvm` recommended)
- pnpm (this repo expects pnpm v11+)

### Install

```bash
source ~/.nvm/nvm.sh && nvm use default
pnpm install
```

### Common scripts

Run from the repo root:

```bash
pnpm build      # build all packages
pnpm test       # run tests for all packages
pnpm typecheck  # typecheck all packages
```

Run for a single package:

```bash
pnpm --filter @pubfunc/node-env build
pnpm --filter @pubfunc/node-env test
pnpm --filter @pubfunc/node-env typecheck
```

## Versioning & changelogs (Changesets)

This repo uses **Changesets** with **independent versioning** (each package versions independently).

### Add a changeset

After making a change you want to release:

```bash
pnpm changeset
```

### Generate versions + changelogs

This updates package versions and generates/updates changelogs:

```bash
pnpm version-packages
```

### Publish

CI publishes via **npm trusted publishing (OIDC)** — no `NPM_TOKEN` required. Each package must have a trusted publisher configured on npmjs.com pointing at this repo and `release.yml`.

Locally, build and publish with npm (after `npm login`):

```bash
pnpm build
bash scripts/ci-publish.sh
```

## Adding a new package

1. Create a new folder under `packages/<name>/`
2. Name it `@pubfunc/<name>` in its `package.json`
3. Add build/test scripts (follow the existing `packages/node-env` template)
4. Add it to the **Packages** list above


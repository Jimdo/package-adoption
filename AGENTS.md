# package-adoption

This file is the source of truth for AI assistant guidance in this repository. `CLAUDE.md` is a symlink to this file so that Claude Code, Codex, Copilot, and other agents share the same rules.

CLI and library that finds where an npm package is used across a GitHub org, with version and path per repo. Published to npm as `package-adoption` (public, MIT). Run by hand (`npx package-adoption`) to see which Jimdo repos use a package. Ships from the Release workflow on push to `main`.

## Run it

Node 24.15.0 and npm 12.1.0 (volta pin in package.json; `engines` sets the same floor). No `@jimdo/*` dependencies, so no npm token is needed to install.

```sh
npm ci
cp config.example config.json    # fill in org, ghAuthToken (PAT with scope repo), pkgName
npm run dev                      # bin/cli.ts through ts-node, reads ./config.json
npm run dev -- --output out.json
```

Without `config.json` the CLI takes `--org=Jimdo --token=<pat> --pkg=@jimdo/ui`. The published CLI (`npx package-adoption`) takes the same flags. `config.json` is git-ignored.

## Test it

```sh
npm test            # vitest run --coverage, test/**/*.spec.ts
npm run typecheck   # tsc --noEmit, not run in CI
npm run check       # biome check --write ./src/, not run in CI
```

CI on a PR is one job, `build` (pr.yml): `npm ci`, `npm run build`, `npm test`. Merging to `main` needs the `build` check green and one approving review (branch protection and a repo ruleset both say so). An org ruleset and the repo ruleset require signed commits. The pre-commit hook runs lint-staged (biome on staged `.ts`) and `vitest run`.

## Where to be careful

- Releases are not automatic. `npm run semantic-release` is `repo-scripts/npm-release.ts`: it publishes the version in package.json and exits 0 if that version is already on npm. A merge without a version bump publishes nothing; a version bump on `main` publishes right away.
- `npm version` runs `postversion`, which pushes the `v<version>` tag to origin at once.
- The release script and `npm run dev` go through `node --loader ts-node/esm`. TypeScript majors are ignored in dependabot.yml because TS 7 breaks ts-node 10.
- GitHub code search returns stale or duplicate files, so the version in the output can be wrong (see README). Secondary rate limits are logged, not retried.
- Dependabot PRs are assigned through `assignees` in `.github/dependabot.yml`. The Actions job sibling repos use was removed here on purpose: the org IP allow list 403s REST writes from hosted runners.

## Before you merge a bump

- Any bump: the `build` check covers install, compile and the three specs. Read the changelog for runtime deps.
- `@octokit/*`, `yargs`, `type-fest`, `validate-npm-package-name`: tests mock octokit, so run `npm run dev` against one package and compare the output with the previous version.
- `typescript`, `ts-node`: `npm run typecheck`, then `npm run dev` (the ts-node loader). Majors need a human.
- `vitest`, `@vitest/coverage-v8`, `@biomejs/biome`: `npm test` and `npm run check`. Biome bumps can rewrite files.
- GitHub Actions: check the pinned commit SHA matches the version in the comment.
- `volta.node` or `engines`: CI reads the Node version from package.json, so this changes CI too.

Agents: if you could not run a check, write it under "Needs a human" in the PR instead of claiming it.

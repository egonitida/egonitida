# EgoNitida

EgoNitida is a real-time 3D engine for web applications and games. This repository is its monorepo: the engine's libraries in `libraries/` and the applications built on them in `applications/`.

## Toolchain

The repository is managed by Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. It wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/. Run `vp check` and `vp test` before you finish a change.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+ release. Add a tool name to select part of the graph. For example, run `vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use `vp why <package>` to show the package-manager dependency graph. If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

## TypeScript Configuration

TypeScript 7 checks types and nothing else. Every other job has a tool of its own: Rolldown emits JavaScript and lowers syntax, Oxlint checks rules, Oxfmt formats, and Node.js runs only what it can run as-is. `vp check` type-checks every file against the nearest `tsconfig.json`.

**One rule splits the configuration: the base says how TypeScript checks, each project says where its code runs.**

- `tsconfig.base.json` holds only what is the same everywhere: strictness, the lint-like options switched off because Oxlint checks them, `noEmit`, `target: "esnext"`, `erasableSyntaxOnly` and `verbatimModuleSyntax`. Nothing in it describes a runtime.
- Each project's `tsconfig.json` extends the base and describes its environment, and nothing else: `lib` for the built-in API its runtime has, `types` for its host API, `module` for who resolves its imports, and `include` for its files, as `["**/*.ts"]`.
- A project whose files run in two environments gets one config per environment, each including only the files that run there. The website's `tsconfig.json` only references `tsconfig.app.json` (its `src`, in the browser) and `tsconfig.node.json` (its configs, in Node.js). The root `tsconfig.json` covers the root's own files alone, `["*.ts"]`, never another project's.

**Decisions behind the values:**

- `lib` matches the runtime, checked rather than assumed: `es2025` for Node.js 24, `es2022` and `dom` for Vite's default build target in the browser. TypeScript checks the API; nothing else can, as Rolldown lowers syntax but never adds API.
- `target` stays `esnext` in the base. Syntax is lowered by Rolldown, which bundles everything that ships, browser and workerd alike, and Node.js rejects what it cannot parse. TypeScript does not police syntax.
- `module` is `preserve` wherever a bundler or a loader resolves imports, which is every project today, and `nodenext` only where Node.js resolves them itself.
- `allowImportingTsExtensions` and `.ts` import specifiers belong only to scripts that Node.js runs as-is. Everything bundled imports without an extension.
- `@types/node` is pinned to the Node.js major in `devEngines`. When the Node.js floor moves, move `devEngines.runtime`, `engines.node` in the libraries, `@types/node`, and the comments that name the version together.
- Options keep their TypeScript 7 defaults unless a reason is written beside them: `strict`, `types: []`, `moduleResolution` follow from what is set.

**Comments.** Every compiler option that is set carries a one-line comment in one form, stating who takes the job or what the value is checked against, without explaining why: ``Rule checked by Oxlint `eslint/no-unreachable` instead.``, `Rule checked by TypeScript, as Oxlint has no equivalent.`, `Imports resolved by Rolldown instead.`, `Built-in API checked against Node.js 24.`

# EgoNitida

EgoNitida is a real-time 3D engine for web applications and games. This repository is its monorepo: the engine's libraries in `libraries/`, the applications built on them in `applications/`, and the Cloudflare account state they run on in `infrastructure/`.

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
- `devEngines.runtime` is the Node.js the repository is developed and tested with, and only the tools set its floor. `engines.node` in each library is never lower, as nothing below it is tested, and is raised further only by the library's own code. It is an open range, `>=`, so newer majors stay supported.
- `@types/node` is pinned to the Node.js major in `engines.node`, so the published code is checked against the oldest runtime it supports. The comments that name the version move with it.
- Options keep their TypeScript 7 defaults unless a reason is written beside them: `strict`, `types: []`, `moduleResolution` follow from what is set.

**Comments.** Every compiler option that is set carries a one-line comment in one form, stating who takes the job or what the value is checked against, without explaining why: ``Rule checked by Oxlint `eslint/no-unreachable` instead.``, `Rule checked by TypeScript, as Oxlint has no equivalent.`, `Imports resolved by Rolldown instead.`, `Built-in API checked against Node.js 24.`

## Zone Configuration

`infrastructure/zone` is an Alchemy stack that declares the whole state of the domain on Cloudflare: registration, DNS, DNSSEC, mail, certificates, TLS, protocols, visitors, content, cache and observability. A new domain needs nothing set in the dashboard beyond buying it.

**One rule decides what is pinned: pin every value that shapes what the zone serves today, or that guards a security or standards decision, whether it matches Cloudflare's default or not. Leave out everything else.**

- Pin decisions: values that differ from the default or follow from a principle below.
- Pin defaults the zone relies on, such as IPv6, HTTP/3, TLS 1.3 and Universal SSL.
- Pin security guards even when they have no effect today, such as `ssl: 'strict'` for a future origin.
- Leave out what the plan does not offer, what Cloudflare deprecated, what only affects a feature the zone does not use (an origin, secondary DNS), and Cloudflare's own operating values that no standard improves on, such as the SOA timers.

**Principles behind the values:**

- Published standards are followed strictly, and a value cites its RFC where one applies. What a standard deprecates is not allowed.
- Cloudflare does not change how the website works or what it serves. Isolated additions are fine, such as a measurement script or a header.
- Bots are let through by default. Only clearly abusive traffic is challenged.
- The domain and every email address are read from `infrastructure/zone/.env`, one explicitly named variable each, never written in code. `infrastructure/zone/.env.example` lists the variables without values.
- The whole stack is retained: destroying it forgets the resources and leaves them on Cloudflare. A value is switched off by setting it, never by deleting its resource.
- The MTA-STS policy in `infrastructure/zone/mta-sts` and the `id` in the `_mta-sts` record change together. Senders only fetch a changed policy when the `id` changes.
- A hostname deeper than the first level, such as `docs.v2.egonitida.com`, is served only as a Worker custom domain, which gets its own certificate. Universal SSL covers only the apex and first-level subdomains, and HSTS with `includeSubDomains` makes a hostname without a certificate unreachable.

**Comments.** Every pinned value carries a one-line comment in the same form as the TypeScript configuration: `HTTP requests redirected to HTTPS by Cloudflare.`, `HTML served as shipped, untouched by Cloudflare.`, `TLS 1.0 and 1.1 refused by Cloudflare, as RFC 8996 deprecates them.`

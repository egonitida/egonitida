# EgoNitida

EgoNitida is a real-time 3D engine for web applications and games. This repository is its monorepo: the engine's libraries in `libraries/` and the applications built on them in `applications/`.

## Toolchain

The repository is managed by Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. It wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/. Run `vp check` and `vp test` before you finish a change.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+ release. Add a tool name to select part of the graph. For example, run `vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use `vp why <package>` to show the package-manager dependency graph. If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

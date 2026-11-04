# EgoNitida

EgoNitida is a real-time 3D engine for web applications and games. This repository is its monorepo: the engine's libraries in `libraries/`, the applications built on them in `applications/`, the examples of how to use them in `examples/`, and the Cloudflare account state they run on in `infrastructure/`.

## Toolchain

The repository is managed by Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. It wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/. Run `npm run check` and `vp test` before you finish a change, and write tests as [TESTING.md](documentation/TESTING.md) sets out. `libraries/theory/` holds the engine's theory, proved in Lean, and `npm run check` builds it. Lean comes through elan (`brew install elan-init`), at the version `lean-toolchain` pins.

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

- `lib` matches the runtime, checked rather than assumed: `es2025` for Node.js 26, `es2022` and `dom` for Vite's default build target in the browser, and `es2025` without host types for engine code that runs everywhere, as the engine is WebGPU only and every WebGPU-generation browser has ES2025. TypeScript checks the API; nothing else can, as Rolldown lowers syntax but never adds API.
- `target` stays `esnext` in the base. Syntax is lowered by Rolldown, which bundles everything that ships, browser and workerd alike, and Node.js rejects what it cannot parse. TypeScript does not police syntax.
- `module` is `preserve` wherever a bundler or a loader resolves imports, which is every project today, and `nodenext` only where Node.js resolves them itself.
- `allowImportingTsExtensions` and `.ts` import specifiers belong only to scripts that Node.js runs as-is. Everything bundled imports without an extension.
- `devEngines.runtime` is the Node.js the repository is developed and tested with, and only the tools set its floor. `engines.node` in each library is never lower, as nothing below it is tested, and is raised further only by the library's own code. It is an open range, `>=`, so newer majors stay supported.
- `@types/node` is pinned to the Node.js major in `engines.node`, so the published code is checked against the oldest runtime it supports. The comments that name the version move with it.
- Options keep their TypeScript 7 defaults unless a reason is written beside them: `strict`, `types: []`, `moduleResolution` follow from what is set.

**Comments.** Every compiler option that is set carries a one-line comment in one form, stating who takes the job or what the value is checked against, without explaining why: ``Rule checked by Oxlint `eslint/no-unreachable` instead.``, `Rule checked by TypeScript, as Oxlint has no equivalent.`, `Imports resolved by Rolldown instead.`, `Built-in API checked against Node.js 26.`

## Theory and Implementation

The engine is defined in Lean in `libraries/theory` before it is written in TypeScript, and the TypeScript is checked against what Lean computes.

The decisions the core rests on are recorded in [DECISIONS.md](documentation/DECISIONS.md).

**One rule decides what Lean defines: whatever two hosts must compute to the same bits.** The machine, its states, inputs and outputs, numbers, the random generator, the composition of a transition, and the encoding of a state and a log are defined in Lean. Rendering, sound, devices, the network, storage, and the runtime are not, as they carry or show what the machine computes and compute nothing it depends on. Mathematics that rendering shares with the machine, such as a transform used for collisions, is defined in Lean.

| Meaning                       | Fits                  | Misses                |
| ----------------------------- | --------------------- | --------------------- |
| where a rule of physics lives | Lean, then TypeScript | TypeScript alone      |
| where a shader lives          | TypeScript alone      | Lean, then TypeScript |

**One rule orders the work: each part of a feature comes from the part before it, first its definitions in Lean, then its tests, then its implementation, then its documentation.**

- A declaration of the theory rests on the standard axioms of Lean alone, `propext`, `Quot.sound`, and `Classical.choice`, and is computed as Lean checks it: never an axiom, `opaque`, `partial`, `unsafe`, `noncomputable`, `@[implemented_by]`, or `@[extern]`. `npm run build` checks every declaration in `npm run check`. The tools beside the theory, `Oracle`, `Declaration`, `Foundation`, and `ExportTypeScript`, may be partial, as they decide nothing about the engine.
- A declaration in Lean marked `@[export_typescript]` is written as TypeScript by `npm run generate` into `<Module>.generated.ts`, which `npm run check` writes and git ignores. That module is the public one: its types with their documentation comments, a `make` for each structure, and the export of each function from `<Module>.ts`. `<Module>.ts` is written by hand and holds the functions alone, each on its generated type and under the documentation comment of Lean, which `npm run generate` checks.
- Its tests come from what Lean computes, as [TESTING.md](documentation/TESTING.md) sets out, and fail until the implementation exists. The interface of the implementation is decided with them, as they call it.
- The implementation is done once its tests pass.
- The encyclopedia is read from the definitions in Lean, and the guides and the reference from the implementation. The Proof section of the reference holds every module of the theory whole, as `npm run generate` writes it into `libraries/theory/documentation`, which git ignores.
- What can be derived from a result is neither returned nor stored.

  | Meaning                                     | Fits    | Misses                                     |
  | ------------------------------------------- | ------- | ------------------------------------------ |
  | the result of a sequence of inputs, in Lean | `State` | `State × List Output`, the outputs as well |

**How the TypeScript copies the Lean:** a declaration in TypeScript has the name, the documentation comment, and the shape of its declaration in Lean, and differs only where that shape is not how JavaScript writes it. `Declaration` writes each of these rules but the one on the modules of Effect, which holds for the bodies written by hand, so a change to any other changes the generator.

- A function takes its arguments together, as JavaScript writes them, where Lean curries them by the convention of its language.

  | Meaning                     | Fits                                              | Misses                                                |
  | --------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
  | the transition of a machine | `(currentState, input) => Outcome<State, Output>` | `(currentState) => (input) => Outcome<State, Output>` |

- A structure is made by `make`, given its fields by name, as Lean gives them.

  | Meaning          | Fits                             | Misses                       |
  | ---------------- | -------------------------------- | ---------------------------- |
  | making a machine | `Machine.make({ structureMap })` | `Machine.make(structureMap)` |

- A function takes its arguments in order, as Lean takes them, and has one form of call alone.

  | Meaning                    | Fits                                                 | Misses                                                                             |
  | -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
  | the state after the inputs | `iteratedTransitionFunction(machine, state, inputs)` | the same with `pipe(machine, iteratedTransitionFunction(state, inputs))` beside it |

- A function is pure wherever its definition in Lean is, and returns its value rather than an effect.

  | Meaning                    | Fits    | Misses                 |
  | -------------------------- | ------- | ---------------------- |
  | the state after the inputs | `State` | `Effect.Effect<State>` |

- A function computes with the modules of Effect wherever one has the operation, and with the built-in methods of JavaScript nowhere else.

  | Meaning                    | Fits                             | Misses                    |
  | -------------------------- | -------------------------------- | ------------------------- |
  | the state after the inputs | `Array.reduce(inputs, state, …)` | `inputs.reduce(…, state)` |

- A finite sequence stays finite, as a list in Lean is.

  | Meaning                 | Fits                   | Misses            |
  | ----------------------- | ---------------------- | ----------------- |
  | the inputs of a machine | `ReadonlyArray<Input>` | `Iterable<Input>` |

- A type parameter states its variance, as its place in the definition gives it, and TypeScript checks the statement against the structure.

  | Meaning                     | Fits                                          | Misses                          |
  | --------------------------- | --------------------------------------------- | ------------------------------- |
  | the parameters of a machine | `Machine<in out State, in Input, out Output>` | `Machine<State, Input, Output>` |

- A value whose parts have names is a structure in Lean, so each part carries the term it stands for, and never a product whose parts have positions alone.

  | Meaning                    | Fits                                                         | Misses                     |
  | -------------------------- | ------------------------------------------------------------ | -------------------------- |
  | the result of a transition | `Outcome<State, Output>`, with `successorState` and `output` | `readonly [State, Output]` |

## Documentation Comments

Every declaration in the libraries and the examples carries a TSDoc comment, and the reference of `@egonitida/core` is read from them, so a comment is written for readers. A declaration written from Lean carries the comment of Lean, generated or checked against it.

**One rule decides what a comment says: what the symbol is, in one sentence, and nothing else.**

- Never repeat the symbol's name, never say what it is not, and never explain why it is so: `/** An identity in a simulation. */` for `Entity`, not `/** An entity: a thing that is there, known by its id. */`.
- Bring in another term only when it is what tells the symbol apart: `/** A kind of data that describes an entity. */` for `Component`, as "A kind of data in a simulation." fits the tick as well.
- A type or a definition opens with "A" or "An", a field or a specific thing with "The": `/** The name that identifies it. */`.
- A function written in TypeScript alone says what it does with a verb that is not its own name: `/** Creates a component from its name and schema. */` for `make`. A function from Lean carries the comment of Lean, as Documentation in Lean sets out.
- A schema and its type of the same name pair up: `/** A schema of an identity in a simulation. */` beside `/** An identity in a simulation. */`.
- No possessive is written with an apostrophe. What belongs to something is said with "of", as the documentation pages set out.

**Documentation in Lean.** Every declaration of the theory carries a documentation comment, which `linter.missingDocs` requires, and it is the comment TypeScript and the glossary carry. A module opens with a documentation comment in the form Mathlib gives it: a summary, `## Main definitions`, `## Implementation notes` where it has any, and `## References`, its mathematics in LaTeX between `$`, which the docs set as MathML Core.

- A declaration says what it is, in one sentence, a function included, as its comment is the card of its term. The rules above on what a comment leaves out hold as well: it never repeats the name, never says what a thing is not, never explains why, and writes no possessive with an apostrophe.

  | Meaning                          | Fits                                                                                         | Misses                                                                          |
  | -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
  | the iterated transition function | "A function that gives the state a machine reaches from a state after a sequence of inputs." | "Gives the state a machine reaches…", as a function in TypeScript alone says it |

- A law is a `theorem` named by what it states, in snake case after the declaration it speaks of, as Mathlib names it, and its comment states it in one sentence that introduces every variable of its formula, with the formula after it. The notation of a declaration, such as $\delta^*$ or $\circ$, comes from the `## Main definitions` of the module.

  | Meaning                     | Fits                                                                                                                                                      | Misses                                |
  | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
  | the law of joined sequences | `iteratedTransitionFunction_append`, "Iterating over two sequences $\sigma$ and $\tau$ in turn from a state $s$ reaches…, $\delta^*(s, \sigma \tau) = …$" | `lemma3`, "Proves that append works." |

A line comment on a configured value takes the form the TypeScript configuration sets out: one line on who takes the job or what the value is checked against, such as `Type tests checked by TypeScript beside the tests Vitest runs.`

## Naming

A name is the first thing a reader learns about anything in the code, and often all they read before they use it. Modules, types, values, functions and parameters are therefore named with the same care, so that each name can be trusted to mean what it says.

- A name says what it stands for, not where that comes from.

  | Meaning                      | Fits        | Misses           |
  | ---------------------------- | ----------- | ---------------- |
  | draws random numbers         | `generator` | `mulberry32`     |
  | tells one thing from another | `id`        | `uuid`           |
  | tells the time               | `clock`     | `performanceNow` |

- A name is explicit rather than implied, longer and exact over short and left to guess, in the context it is read in.

  | Meaning             | Fits        | Misses |
  | ------------------- | ----------- | ------ |
  | where a point is    | `position`  | `pos`  |
  | one component       | `component` | `c`    |
  | the input of a step | `Input`     | `I`    |

- A word is taken in its real meaning, as a dictionary gives it, not in an established convention or in how it strikes a reader.

  | Meaning                              | Fits      | Misses   |
  | ------------------------------------ | --------- | -------- |
  | puts a new value in place of the old | `replace` | `update` |
  | looks something up in memory         | `find`    | `fetch`  |
  | takes an entity out of the state     | `remove`  | `kill`   |

- A term comes from the field that defines it, in that field's meaning. What no field defines is named in academic English.

  | Meaning                                  | Fits       | Misses    |
  | ---------------------------------------- | ---------- | --------- |
  | combines a list into one value, in order | `fold`     | `reduce`  |
  | the rate at which a position changes     | `velocity` | `speed`   |
  | applies a function to every value        | `map`      | `forEach` |

- A boolean is named by the quality it states. A function that asks for one is named with `is` or `has`.

  | Meaning                          | Fits       | Misses       |
  | -------------------------------- | ---------- | ------------ |
  | whether it is turned off         | `disabled` | `isDisabled` |
  | asks whether an option holds one | `isSome`   | `some`       |
  | asks whether a set holds a value | `has`      | `contains`   |

## Documentation Pages

A page of the documentation is read from its title to its end as one piece, so its prose answers to rules of its own, beyond what each sentence needs on its own.

- No two paragraphs of a page open with the same word, counting the description under its title.

  | Meaning                        | Fits                                               | Misses                                            |
  | ------------------------------ | -------------------------------------------------- | ------------------------------------------------- |
  | the openings of two paragraphs | Beneath every application… / Inside every machine… | Beneath every application… / Beneath every state… |

- A page's description is the highest view of the page, the one sentence everything else on the page unfolds.

  | Meaning                           | Fits                                                                                                    | Misses                                                        |
  | --------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | what the Simulation page is about | Beneath every application built on the engine, machines run, each transitioning from its current state… | States consist of relations, and relations consist of tuples. |

- Every section opens with a short introduction that names the terms of the section without explaining them, and a figure right under it explains them. The introduction is the only prose between the heading and the figure, and after the figure the section may go on in prose and further figures.

  | Meaning              | Fits                                                                                         | Misses                                                                                  |
  | -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
  | what a simulation is | …machines, each transitioning from its current state, upon an input…, then the Mealy machine | …machines, each a Mealy machine, a tuple (S, S₀, Σ, Λ, T, G) whose transition function… |

- A heading is an uncountable noun, the name of the idea its section sets out, never one thing nor many.

  | Meaning                            | Fits        | Misses              |
  | ---------------------------------- | ----------- | ------------------- |
  | what the machine takes in          | Input       | Inputs              |
  | how a machine moves between states | Transition  | A Transition        |
  | whether one past gives one future  | Determinism | Deterministic Steps |

- Every figure links to the study or paper it rests on, its author and year in the corner of the figure.

  | Meaning                    | Fits                                  | Misses                          |
  | -------------------------- | ------------------------------------- | ------------------------------- |
  | the formula of the machine | f : S → (S × O)^I, with ↗ Mealy, 1955 | f : S → (S × O)^I, with no link |
  - Where the idea and its notation come from different works, the figure links to both, the origin of the idea first.

    | Meaning                      | Fits                                                 | Misses                                |
    | ---------------------------- | ---------------------------------------------------- | ------------------------------------- |
    | where the formula comes from | f : S → (S × O)^I, with ↗ Mealy, 1955 ↗ Jacobs, 2016 | f : S → (S × O)^I, with ↗ Mealy, 1955 |

- A figure is a definition, an example, or an illustration. A definition states its idea in the notation of the works it links to, an example gives a definition values, and an illustration shows an idea and states nothing.

  | Meaning                  | Fits                                                      | Misses                                     |
  | ------------------------ | --------------------------------------------------------- | ------------------------------------------ |
  | the figure of a relation | r ⊆ { t \| ∀a ∈ A : t(a) ∈ D(a) }, then a board of floors | a board of floors alone, as the definition |

- Under every definition stands an example of it, which moves as the definition says, in steps that can be paused and taken forward and back, the same every time. Without motion its steps stand side by side, and the agent Markdown gives them as a table.

  | Meaning                    | Fits                                                                                  | Misses                                                |
  | -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
  | the example of the machine | one transition of an elevator, s and i going in and o and s′ coming out, step by step | a still drawing, or an elevator that moves on its own |

- Every example comes from one world, an elevator, which the cards of the glossary share with every page.

  | Meaning                  | Fits                           | Misses                                                         |
  | ------------------------ | ------------------------------ | -------------------------------------------------------------- |
  | an example of a relation | the board of floors in a lobby | a board of floors on one page and a billiard table on the next |

- The prose says in words everything a figure states, so a reader who never looks at a figure misses nothing.

  | Meaning                     | Fits                                                                                                                            | Misses                                    |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
  | what the Mealy machine says | One function makes up every machine. Its structure map takes the current state and an input to a successor state and an output… | f : S → (S × O)^I, with no words after it |

- Every definition and every example has a declaration in Lean in `libraries/theory`, named after its term, and the documentation comment of the declaration is the card of the term.

  | Meaning             | Fits                                                                                | Misses                                                             |
  | ------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
  | the machine in Lean | `structure Machine`, commented "A state-based system that transitions upon inputs…" | a figure with no declaration, or a comment that says another thing |

- An example is drawn in SVG until the engine runs inside the documentation, and from then on it runs on the engine.

  | Meaning                | Fits                                    | Misses                                          |
  | ---------------------- | --------------------------------------- | ----------------------------------------------- |
  | what draws the example | SVG now, the engine once it is embedded | a video, or a drawing the engine never replaces |

- A statement is exactly as general as what it is true of, never narrowed to one case of it nor widened beyond it.

  | Meaning                       | Fits                                           | Misses                               |
  | ----------------------------- | ---------------------------------------------- | ------------------------------------ |
  | where the machines run        | Beneath every application built on the engine… | Beneath every real-time application… |
  | how many machines an app runs | …run machines, each…                           | …runs one machine, which…            |

- Prose says what a thing is and what it does, never why it is good or who else relies on it.

  | Meaning         | Fits                                                                                         | Misses                                                                                                       |
  | --------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
  | what a state is | Inside every machine, a state holds the information the machine carries between transitions… | Every state takes its shape from the mathematics that has kept the world's data in order for half a century. |
  - Prose never lists what can be done with a thing. What a thing is and what it does are said, and its uses are left to the reader.

    | Meaning                 | Fits                                                                       | Misses                                                                           |
    | ----------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
    | whether a state changes | Once made, a state never changes, as a transition makes a successor state… | Once made, a state never changes, and it can travel to a disk, across a network… |

- No word judges what it describes, such as quiet, powerful, simple, elegant, or fast. A word says what a thing is or does, and the reader judges.

  | Meaning                          | Fits                                                               | Misses                                                                   |
  | -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
  | what runs beneath an application | Beneath every application built on the engine, machines run, each… | Beneath every application built on the engine, quiet machines run, each… |

- No paragraph opens with an article. The reference and the cards of the glossary are the exceptions, as both say what a thing is in the form of a documentation comment, which opens with one.

  | Meaning                        | Fits                                                | Misses                                        |
  | ------------------------------ | --------------------------------------------------- | --------------------------------------------- |
  | what a state keeps of the past | Nothing from the past survives among the relations… | The state keeps nothing from the past unless… |

- No possessive is written with an apostrophe, here or anywhere else, the documentation comments included. What belongs to something is said with "of".

  | Meaning                | Fits                   | Misses            |
  | ---------------------- | ---------------------- | ----------------- |
  | the state of a machine | the state of a machine | a machine's state |

- A pronoun points to one thing alone, the last that could be meant. Where two could be meant, the thing is named again.

  | Meaning                             | Fits                                                                         | Misses                                                  |
  | ----------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
  | how a machine moves on from a state | …unless its future depends on it. Whichever way a machine reached its state… | …unless its future depends on it. However it got there… |

- Prose never speaks to the reader. It neither addresses them nor tells them what to do, notice, or remember.

  | Meaning                 | Fits                                         | Misses                                            |
  | ----------------------- | -------------------------------------------- | ------------------------------------------------- |
  | whether a state changes | Once made, a state never changes…            | You cannot change a state once it is made…        |
  | what the figure shows   | Three relations belong to the engine itself… | Notice that three relations belong to the engine… |

- No personal pronoun stands in the prose: no I, we, you, he, she, or they for a person. Whoever acts is named.

  | Meaning                   | Fits                                    | Misses                           |
  | ------------------------- | --------------------------------------- | -------------------------------- |
  | how a relation is defined | A relation is defined over its domains… | We define a relation over…       |
  | who wrote the paper       | Codd set out the relational model…      | He set out the relational model… |

- A term is named in the introduction of its section and explained by the figure under it, and from there on it means that alone. One thing keeps one name, never varied for the sake of style.

  | Meaning               | Fits                             | Misses                        |
  | --------------------- | -------------------------------- | ----------------------------- |
  | one row of a relation | a tuple… the tuple… every tuple… | a tuple… the row… every fact… |
  - Where the field knows one thing by several names, one of them is chosen, and the others never appear.

    | Meaning                                          | Fits                    | Misses                    |
    | ------------------------------------------------ | ----------------------- | ------------------------- |
    | what holds a state and transitions upon an input | a machine… the machine… | a machine… the automaton… |

- A term, a word the page takes in the meaning a field defines for it, is marked at every appearance, `:Term[the words]{id="…"}`, so its card, what it is in one sentence and an example of one, is a pointer away wherever it stands.

  | Meaning                | Fits                                         | Misses                      |
  | ---------------------- | -------------------------------------------- | --------------------------- |
  | a term in running text | :Term[successor state]{id="successor-state"} | successor state, left plain |

- A symbol is introduced before it is used, by its name in the text or by the words a figure sets under it.

  | Meaning                 | Fits                                              | Misses                            |
  | ----------------------- | ------------------------------------------------- | --------------------------------- |
  | the states of a machine | f : S → (S × O)^I, with S annotated as the states | f : S → (S × O)^I, S left unnamed |

- A sentence runs from its start to its end without a clause set into its middle, and says its thing in the shortest construction that keeps it exact.

  | Meaning                        | Fits                                                                                   | Misses                                                                                                   |
  | ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
  | what a state keeps of the past | …a state keeps the part of the past that the future depends on, as a set of relations. | …a state holds, as a set of relations, just as much of the past as the future of the machine depends on. |

- No contraction is written.

  | Meaning                 | Fits            | Misses        |
  | ----------------------- | --------------- | ------------- |
  | a state does not change | does not, it is | doesn't, it's |

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

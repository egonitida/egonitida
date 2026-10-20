# Testing

Tests run on Vitest through `vp test`, and every change passes them before it is finished.

**One rule decides what is tested: a test pins a decision of our own, and the tests are the source of truth for it.**

- Test what we decided, even when a dependency carries it out. `Entity` is an integer because we chose `Schema.Int`, so `libraries/core/src/Entity.test.ts` checks that it is never a fraction: anyone can swap `Int` for something else, and the test catches it.
- Never test what a dependency does that we never chose, such as `Schema.Int` rejecting `NaN`, or a compiler evaluating what it is given. Leave that to its maintainers and to the build.
- Mock a dependency only when the test is about our values passed to it. A mock of the logic under test proves nothing.

**Where tests live and what they import:**

- A test sits beside the module it checks, `Entity.test.ts` beside `Entity.ts`.
- Libraries write their tests with `@effect/vitest`, `it` for plain tests and `it.effect` for effects. Applications write theirs with `vite-plus/test` and `test`.

**How a test is written:**

- `describe` names the subject, and each test's title completes a sentence about it: `describe('Entity')` and `it('is never negative')` read as "Entity is never negative." The reference of `@egonitida/core` lists every such sentence under its module, so a title is written for readers.
- Each test is one decision, so a failing test names the decision that broke.
- Tests stand in one order: what the subject is, then what it never is, then what its types hold. The reference lists their sentences in that order.
- Tests are DAMP, not DRY: each one reads alone, without helpers to look up, even when that repeats code.
- A predicate is checked with `toSatisfy`, the value in `expect` and the predicate in the matcher: `expect(-1).not.toSatisfy(Schema.is(Entity))`.
- A decision about types is checked with `expectTypeOf`, `expectTypeOf<number>().not.toExtend<Entity>()`. Vitest's typecheck mode, switched on in every project's `vite.config.ts`, runs it through TypeScript, so a type test fails in `vp test` like any other.
- A call that must not compile is written out under `// @ts-expect-error`, followed by a sentence saying why it fails. Once the call compiles, the comment has nothing left to expect, and the typecheck fails the test.

**Tests and the theory:** a law the Lean theory proves gets a property test in Vitest, on values generated from the schemas, so the TypeScript implementation is checked against the same law the model is proved to keep.

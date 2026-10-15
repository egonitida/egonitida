import { NodeServices } from '@effect/platform-node';
import { expect, layer } from '@effect/vitest';
import { Effect } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import { TestConsole } from 'effect/testing';
import { program } from '#src/Program.ts';

/** What the program writes to the test's console, as one text. */
const written = Effect.gen(function* () {
  yield* program;
  return (yield* TestConsole.logLines).join('\n');
});

layer(NodeServices.layer)('Entrypoint', (it) => {
  it.effect('runs as a command, printing what its program writes', () =>
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
      const printed = yield* spawner.string(
        ChildProcess.make(process.execPath, [
          new URL(import.meta.resolve('#src/Entrypoint.ts')).pathname,
        ]),
      );
      expect(printed).toBe(`${yield* written}\n`);
    }),
  );
});

import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import { TestConsole } from 'effect/testing';
import manifest from '#package.json' with { type: 'json' };
import { program } from '#src/Program.ts';

/** Every channel `npx egonitida` must list, by its label. */
const expected = [
  ['Website', 'https://egonitida.com'],
  ['Source', 'https://github.com/egonitida/egonitida'],
  ['Packages', 'https://npmjs.com/org/egonitida'],
  ['Discord', 'https://discord.gg/6zsggGTGZf'],
  ['X', 'https://x.com/egonitida'],
  ['Instagram', 'https://instagram.com/egonitida'],
  ['Threads', 'https://threads.com/@egonitida'],
] as const;

/** What the program writes to the test's console, as one text. */
const written = Effect.gen(function* () {
  yield* program;
  return (yield* TestConsole.logLines).join('\n');
});

describe('Program', () => {
  it.effect('names EgoNitida at the version published', () =>
    Effect.gen(function* () {
      expect(yield* written).toContain(`EgoNitida ${manifest.version}`);
    }),
  );

  it.effect('lists every channel on a line of its own, its label beside its address', () =>
    Effect.gen(function* () {
      const lines = (yield* written).split('\n');
      for (const [label, url] of expected) {
        const line = lines.find((each) => each.endsWith(url));
        expect(line?.trim().startsWith(label)).toBe(true);
      }
    }),
  );

  it.effect('lines up every address in one column', () =>
    Effect.gen(function* () {
      const lines = (yield* written).split('\n');
      const columns = expected.map(([, url]) =>
        lines.find((each) => each.endsWith(url))?.indexOf(url),
      );
      expect(new Set(columns).size).toBe(1);
    }),
  );
});

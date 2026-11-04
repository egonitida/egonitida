import { describe, expect, it } from '@effect/vitest';
import { oracle } from '@egonitida/theory/Oracle';
import * as Machine from '#src/Machine.generated';

describe('iteratedTransitionFunction', () => {
  it('gives the state the theory gives, on every argument the tests run over', () => {
    for (const { arguments: argumentList, value } of oracle.iteratedTransitionFunction) {
      expect(
        Machine.iteratedTransitionFunction(...argumentList),
        JSON.stringify(argumentList),
      ).toBe(value);
    }
  });
});

describe('behavior', () => {
  it('gives the output the theory gives, on every argument the tests run over', () => {
    for (const { arguments: argumentList, value } of oracle.behavior) {
      expect(Machine.behavior(...argumentList), JSON.stringify(argumentList)).toBe(value);
    }
  });
});

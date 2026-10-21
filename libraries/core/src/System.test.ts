import { describe, expectTypeOf, it } from '@effect/vitest';
import type { Effect } from 'effect';
import type { System } from '#src/System';

describe('System', () => {
  it('turns a state into a state of the same kind', () => {
    expectTypeOf<System<number>>().parameters.toEqualTypeOf<[state: number]>();
    expectTypeOf<Effect.Success<ReturnType<System<number>>>>().toEqualTypeOf<number>();
  });

  it('never fails', () => {
    expectTypeOf<Effect.Error<ReturnType<System<number>>>>().toEqualTypeOf<never>();
  });

  it('needs nothing from outside the state', () => {
    expectTypeOf<Effect.Services<ReturnType<System<number>>>>().toEqualTypeOf<never>();
  });
});

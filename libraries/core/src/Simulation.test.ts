import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect } from 'effect';
import * as Simulation from '#src/Simulation';

describe('Simulation', () => {
  it.effect('leaves the state as it is without systems', () =>
    Effect.gen(function* () {
      expect(yield* Simulation.make<number>([]).step(1)).toBe(1);
    }),
  );

  it.effect('runs its systems in the order they are listed', () =>
    Effect.gen(function* () {
      expect(
        yield* Simulation.make<number>([
          (state) => Effect.succeed(state + 1),
          (state) => Effect.succeed(state * 2),
        ]).step(1),
      ).toBe(4);
      expect(
        yield* Simulation.make<number>([
          (state) => Effect.succeed(state * 2),
          (state) => Effect.succeed(state + 1),
        ]).step(1),
      ).toBe(3);
    }),
  );

  it.effect('hands each system the state the one before it left', () =>
    Effect.gen(function* () {
      expect(
        yield* Simulation.make<number>([
          (state) => Effect.succeed(state + 1),
          (state) => Effect.succeed(state + 1),
        ]).step(1),
      ).toBe(3);
    }),
  );

  it('steps a state into a state of the same kind', () => {
    expectTypeOf<Simulation.Simulation<number>['step']>().parameters.toEqualTypeOf<
      [state: number]
    >();
    expectTypeOf<
      Effect.Success<ReturnType<Simulation.Simulation<number>['step']>>
    >().toEqualTypeOf<number>();
  });

  it('never fails to step', () => {
    expectTypeOf<
      Effect.Error<ReturnType<Simulation.Simulation<number>['step']>>
    >().toEqualTypeOf<never>();
  });

  it('needs nothing from outside the state to step', () => {
    expectTypeOf<
      Effect.Services<ReturnType<Simulation.Simulation<number>['step']>>
    >().toEqualTypeOf<never>();
  });

  it('never changes once it is made', () => {
    expectTypeOf<Simulation.Simulation<number>>().toEqualTypeOf<
      Readonly<Simulation.Simulation<number>>
    >();
  });
});

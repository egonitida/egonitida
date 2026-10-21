import { Effect } from 'effect';
import type { System } from '#src/System';

/** A process over states of one kind, given by its step. */
export interface Simulation<A> {
  /** The transition from the state at one tick to the state at the next. */
  readonly step: (state: A) => Effect.Effect<A>;
}

/** Creates a simulation whose step runs the systems one after another, in the order they are listed. */
export const make = <A>(systems: ReadonlyArray<System<A>>): Simulation<A> => ({
  step: (state) =>
    Effect.reduce(
      systems,
      () => state,
      (current, system) => system(current),
    ),
});

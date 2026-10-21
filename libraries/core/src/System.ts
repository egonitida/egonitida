import type { Effect } from 'effect';

/** A rule that turns the state of a simulation into a new state. */
export type System<A> = (state: A) => Effect.Effect<A>;

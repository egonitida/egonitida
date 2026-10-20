import { Schema } from 'effect';

/** A schema of an identity in a simulation. */
export const Entity = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('Entity'),
);

/** An identity in a simulation. */
export type Entity = typeof Entity.Type;

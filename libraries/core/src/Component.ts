import type { Schema } from 'effect';

/** A kind of data that describes an entity. */
export interface Component<out Name extends string, out S extends Schema.Top> {
  /** The name that identifies it. */
  readonly name: Name;
  /** The schema of its data. */
  readonly schema: S;
}

/** Creates a component from its name and schema. */
export const make = <Name extends string, S extends Schema.Top>(
  name: Name,
  schema: S,
): Component<Name, S> => ({ name, schema });

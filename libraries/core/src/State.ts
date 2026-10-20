import { HashMap, HashSet, Record, Schema, Struct } from 'effect';
import type { Component } from '#src/Component';
import { Entity } from '#src/Entity';

/** A function from a component to the schema of its data for each entity that has it, typed for each component apart. */
interface Storage extends Struct.Lambda {
  <S extends Schema.Top>(component: Component<string, S>): Schema.HashMap<typeof Entity, S>;
  readonly '~lambda.out': this['~lambda.in'] extends Component<string, infer S>
    ? Schema.HashMap<typeof Entity, S>
    : never;
}

/** Turns a component into the schema of its data for each entity that has it. */
const storage = Struct.lambda<Storage>((component) => Schema.HashMap(Entity, component.schema));

/** Creates the schema of the entities a simulation holds at one tick and the data of its components, each by its name. */
export const State = <
  const Components extends {
    readonly [Name in keyof Components]: Component<Name & string, Schema.Top>;
  },
>(
  components: Components,
) =>
  Schema.Struct({
    entities: Schema.HashSet(Entity),
    data: Schema.Struct(Struct.map(components, storage)),
  }).check(
    Schema.makeFilter(
      (state) =>
        Record.every(state.data, (stored) =>
          HashMap.every(stored, (_, entity) => HashSet.has(state.entities, entity)),
        ),
      { expected: 'the data of entities that are there alone' },
    ),
  );

import { HashMap, HashSet, Optic, type Option, Record, Schema, Struct } from 'effect';
import { dual } from 'effect/Function';
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

/** A state that holds the data of a component of the name. */
interface Holding<Name extends string, A> {
  readonly data: { readonly [Key in Name]: HashMap.HashMap<Entity, A> };
}

/** Finds the data of the component that the entity has, if it has it. */
export const get: {
  <Name extends string, S extends Schema.Top>(
    component: Component<Name, S>,
    entity: Entity,
  ): (state: Holding<Name, S['Type']>) => Option.Option<S['Type']>;
  <Name extends string, S extends Schema.Top>(
    state: Holding<Name, S['Type']>,
    component: Component<Name, S>,
    entity: Entity,
  ): Option.Option<S['Type']>;
} = dual(
  3,
  <Name extends string, S extends Schema.Top>(
    state: Holding<Name, S['Type']>,
    component: Component<Name, S>,
    entity: Entity,
  ): Option.Option<S['Type']> => HashMap.get(state.data[component.name], entity),
);

/** Turns the data of the component into new data, for every entity at once. */
export const modify: {
  <A extends Holding<Name, S['Type']>, Name extends string, S extends Schema.Top>(
    component: Component<Name, S>,
    f: (data: A['data'][Name]) => A['data'][Name],
  ): (state: A) => A;
  <A extends Holding<Name, S['Type']>, Name extends string, S extends Schema.Top>(
    state: A,
    component: Component<Name, S>,
    f: (data: A['data'][Name]) => A['data'][Name],
  ): A;
} = dual(
  3,
  <A extends Holding<Name, S['Type']>, Name extends string, S extends Schema.Top>(
    state: A,
    component: Component<Name, S>,
    f: (data: A['data'][Name]) => A['data'][Name],
  ): A => Optic.id<A>().key('data').key(component.name).modify(f)(state),
);

import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { HashMap, HashSet, Option, Schema, pipe } from 'effect';
import * as Component from '#src/Component';
import { Entity } from '#src/Entity';
import * as State from '#src/State';

describe('State', () => {
  it('holds the entities that are there', () => {
    expect({ entities: HashSet.make(0, 1), data: { Energy: HashMap.empty() } }).toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('may hold no entity', () => {
    expect({ entities: HashSet.empty(), data: { Energy: HashMap.empty() } }).toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('holds the data of each of its components for each entity that has it', () => {
    expect({ entities: HashSet.make(0, 1), data: { Energy: HashMap.make([0, 100]) } }).toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('gets the data of a component of an entity that has it', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.make(0),
      data: { Energy: HashMap.make([0, 100]) },
    });
    expect(State.get(state, Energy, Entity.make(0))).toStrictEqual(Option.some(100));
  });

  it('gets nothing of an entity without the component', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.make(0),
      data: { Energy: HashMap.empty() },
    });
    expect(State.get(state, Energy, Entity.make(0))).toStrictEqual(Option.none());
  });

  it('gets in a pipe as well', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.make(0),
      data: { Energy: HashMap.make([0, 100]) },
    });
    expect(pipe(state, State.get(Energy, Entity.make(0)))).toStrictEqual(Option.some(100));
  });

  it('modifies the data of a component for every entity at once', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.make(0, 1),
      data: { Energy: HashMap.make([0, 100], [1, 50]) },
    });
    expect(
      State.modify(
        state,
        Energy,
        HashMap.map((energy) => energy + 1),
      ).data.Energy,
    ).toStrictEqual(HashMap.make([0, 101], [1, 51]));
  });

  it('leaves the rest of the state as it is when it modifies', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const Power = Component.make('Power', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy, Power }))({
      entities: HashSet.make(0),
      data: { Energy: HashMap.make([0, 100]), Power: HashMap.make([0, 5]) },
    });
    const { entities, data } = State.modify(
      state,
      Energy,
      HashMap.map((energy) => energy + 1),
    );
    expect({ entities, Power: data.Power }).toStrictEqual({
      entities: HashSet.make(0),
      Power: HashMap.make([0, 5]),
    });
  });

  it('modifies in a pipe as well', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.make(0),
      data: { Energy: HashMap.make([0, 100]) },
    });
    expect(
      pipe(
        state,
        State.modify(
          Energy,
          HashMap.map((energy) => energy + 1),
        ),
      ).data.Energy,
    ).toStrictEqual(HashMap.make([0, 101]));
  });

  it('always knows which entities are there', () => {
    expect({ data: { Energy: HashMap.empty() } }).not.toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('always holds the data of its components', () => {
    expect({ entities: HashSet.empty() }).not.toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('never leaves out any of its components', () => {
    expect({ entities: HashSet.empty(), data: {} }).not.toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('never holds what is not an entity', () => {
    expect({ entities: HashSet.make('0'), data: { Energy: HashMap.empty() } }).not.toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('never holds data of an entity that is not there', () => {
    expect({ entities: HashSet.make(0), data: { Energy: HashMap.make([1, 100]) } }).not.toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('never holds data its component does not accept', () => {
    expect({ entities: HashSet.make(0), data: { Energy: HashMap.make([0, '100']) } }).not.toSatisfy(
      Schema.is(State.State({ Energy: Component.make('Energy', Schema.Finite) })),
    );
  });

  it('holds each component by its own name', () => {
    expectTypeOf(() =>
      // @ts-expect-error A component is held by its own name.
      State.State({ Power: Component.make('Energy', Schema.Finite) }),
    ).toBeFunction();
  });

  it('knows its entities apart from plain numbers', () => {
    const state = State.State({ Energy: Component.make('Energy', Schema.Finite) });
    expectTypeOf<
      (typeof state)['Type']['entities'] extends HashSet.HashSet<infer Element> ? Element : never
    >().toEqualTypeOf<Entity>();
  });

  it('knows the type of the data of each of its components', () => {
    const state = State.State({ Energy: Component.make('Energy', Schema.Finite) });
    expectTypeOf<(typeof state)['Type']['data']['Energy']>().toEqualTypeOf<
      HashMap.HashMap<Entity, number>
    >();
  });

  it('gets the data of a component in its own type', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.empty(),
      data: { Energy: HashMap.empty() },
    });
    expectTypeOf(State.get(state, Energy, Entity.make(0))).toEqualTypeOf<Option.Option<number>>();
  });

  it('never gets the data of a component it does not hold', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.empty(),
      data: { Energy: HashMap.empty() },
    });
    expectTypeOf(() =>
      // @ts-expect-error A state holds the data of its own components alone.
      State.get(state, Component.make('Power', Schema.Finite), Entity.make(0)),
    ).toBeFunction();
  });

  it('keeps the type of the state when it modifies', () => {
    const Energy = Component.make('Energy', Schema.Finite);
    const state = Schema.decodeSync(State.State({ Energy }))({
      entities: HashSet.empty(),
      data: { Energy: HashMap.empty() },
    });
    expectTypeOf(
      State.modify(
        state,
        Energy,
        HashMap.map((energy) => energy + 1),
      ),
    ).toEqualTypeOf(state);
  });

  it('never changes once it is made', () => {
    const state = State.State({ Energy: Component.make('Energy', Schema.Finite) });
    expectTypeOf<(typeof state)['Type']>().toEqualTypeOf<Readonly<(typeof state)['Type']>>();
    expectTypeOf<(typeof state)['Type']['data']>().toEqualTypeOf<
      Readonly<(typeof state)['Type']['data']>
    >();
  });
});

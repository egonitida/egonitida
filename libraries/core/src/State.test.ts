import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { HashMap, HashSet, Schema } from 'effect';
import * as Component from '#src/Component';
import type { Entity } from '#src/Entity';
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
    // @ts-expect-error A component is held by its own name.
    State.State({ Power: Component.make('Energy', Schema.Finite) });
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

  it('never changes once it is made', () => {
    const state = State.State({ Energy: Component.make('Energy', Schema.Finite) });
    expectTypeOf<(typeof state)['Type']>().toEqualTypeOf<Readonly<(typeof state)['Type']>>();
    expectTypeOf<(typeof state)['Type']['data']>().toEqualTypeOf<
      Readonly<(typeof state)['Type']['data']>
    >();
  });
});

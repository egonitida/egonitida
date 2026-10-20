import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';
import { type Component, make } from '#src/Component';

describe('Component', () => {
  it('is its name and its schema, and nothing more', () => {
    expect(make('Energy', Schema.Finite)).toStrictEqual({ name: 'Energy', schema: Schema.Finite });
  });

  it('is named by a string', () => {
    expectTypeOf(make).parameter(0).toEqualTypeOf<string>();
  });

  it('describes its data by a schema', () => {
    expectTypeOf(make).parameter(1).toEqualTypeOf<Schema.Top>();
  });

  it('is known by its name in its type', () => {
    expectTypeOf(make('Energy', Schema.Finite).name).toEqualTypeOf<'Energy'>();
  });

  it('keeps the whole type of its schema', () => {
    expectTypeOf(make('Energy', Schema.Finite).schema).toEqualTypeOf<typeof Schema.Finite>();
  });

  it('fits wherever any component is expected', () => {
    expectTypeOf(make('Energy', Schema.Finite)).toExtend<Component<string, Schema.Top>>();
  });

  it('never changes once it is made', () => {
    expectTypeOf<Component<'Energy', typeof Schema.Finite>>().toEqualTypeOf<
      Readonly<Component<'Energy', typeof Schema.Finite>>
    >();
  });
});

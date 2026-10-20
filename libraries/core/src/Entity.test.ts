import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';
import { Entity } from '#src/Entity';

describe('Entity', () => {
  it('is 0 at the least', () => {
    expect(0).toSatisfy(Schema.is(Entity));
  });

  it('is the largest safe integer at the most', () => {
    expect(Number.MAX_SAFE_INTEGER).toSatisfy(Schema.is(Entity));
  });

  it('is never a string', () => {
    expect('0').not.toSatisfy(Schema.is(Entity));
  });

  it('is never negative', () => {
    expect(-1).not.toSatisfy(Schema.is(Entity));
  });

  it('is never a fraction', () => {
    expect(0.5).not.toSatisfy(Schema.is(Entity));
  });

  it('is never beyond the safe integers', () => {
    expect(Number.MAX_SAFE_INTEGER + 1).not.toSatisfy(Schema.is(Entity));
  });

  it('is never a plain number', () => {
    expectTypeOf<number>().not.toExtend<Entity>();
  });
});

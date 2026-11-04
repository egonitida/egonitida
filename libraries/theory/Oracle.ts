import { execFileSync } from 'node:child_process';
import { Schema } from 'effect';

/** A schema of an element of a set of two. */
const Element = Schema.Literals([0, 1]);

/** An element of a set of two. */
type Element = typeof Element.Type;

/** A schema of the outcome of a transition of a machine of two states and two outputs. */
const Outcome = Schema.Struct({ successorState: Element, output: Element });

/** A schema of the outcomes of one state, by input. */
const Row = Schema.Tuple([Outcome, Outcome]);

/** A schema of the structure map of a machine of two states, two inputs, and two outputs, by state. */
const Table = Schema.Tuple([Row, Row]);

/** The structure map of a machine of two states, two inputs, and two outputs, by state. */
type Table = typeof Table.Type;

/** Creates a schema of the cases of a function from the schemas of its arguments and of its value. */
const Cases = <Arguments extends Schema.Top, Value extends Schema.Top>(
  argumentsSchema: Arguments,
  valueSchema: Value,
) => Schema.Array(Schema.Struct({ arguments: argumentsSchema, value: valueSchema }));

/** A schema of the values the oracle tabulates for the functions of a machine. */
const Values = Schema.Struct({
  iteratedTransitionFunction: Cases(Schema.Tuple([Table, Element, Schema.Array(Element)]), Element),
  behavior: Cases(Schema.Tuple([Table, Element, Schema.Array(Element), Element]), Element),
});

/** A machine of two states, two inputs, and two outputs, with the table of its structure map. */
export interface SmallMachine {
  /** The table of its structure map, by state and input. */
  readonly table: Table;
  /** The function that gives its successor state and output from its current state upon each input. */
  readonly structureMap: (currentState: Element, input: Element) => Table[Element][Element];
}

/** A case of a function, a list of arguments with the value it gives. */
export interface Case<Arguments extends ReadonlyArray<unknown>, Value> {
  /** The arguments, in the order the function takes them. */
  readonly arguments: Arguments;
  /** The value the theory gives on the arguments. */
  readonly value: Value;
}

/** The cases the oracle tabulates for the functions of a machine. */
export interface Oracle {
  /** The cases of the iterated transition function. */
  readonly iteratedTransitionFunction: ReadonlyArray<
    Case<readonly [SmallMachine, Element, ReadonlyArray<Element>], Element>
  >;
  /** The cases of the behavior. */
  readonly behavior: ReadonlyArray<
    Case<readonly [SmallMachine, Element, ReadonlyArray<Element>, Element], Element>
  >;
}

/** Creates the machine whose structure map a table gives. */
const machineOf = (table: Table): SmallMachine => ({
  table,
  structureMap: (currentState, input) => table[currentState][input],
});

/** The values the oracle tabulates, decoded. */
const values = Schema.decodeUnknownSync(Values)(
  JSON.parse(
    execFileSync('npm', ['run', '--silent', 'tabulate'], {
      cwd: import.meta.dirname,
      encoding: 'utf8',
      // Output of any length taken whole, as the oracle writes every case it enumerates.
      maxBuffer: Number.POSITIVE_INFINITY,
    }),
  ),
);

/** The cases the oracle tabulates for the functions of a machine, each machine made from its table. */
export const oracle: Oracle = {
  iteratedTransitionFunction: values.iteratedTransitionFunction.map(
    ({ arguments: [table, state, inputs], value }) => ({
      arguments: [machineOf(table), state, inputs],
      value,
    }),
  ),
  behavior: values.behavior.map(({ arguments: [table, state, inputs, lastInput], value }) => ({
    arguments: [machineOf(table), state, inputs, lastInput],
    value,
  })),
};

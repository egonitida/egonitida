import { Array } from 'effect';
import type { Behavior, IteratedTransitionFunction } from '#src/Machine.generated';

/** A function that gives the state a machine reaches from a state after a sequence of inputs. */
export const iteratedTransitionFunction: IteratedTransitionFunction = (machine, state, inputs) =>
  Array.reduce(
    inputs,
    state,
    (currentState, input) => machine.structureMap(currentState, input).successorState,
  );

/** A function that gives the output of the last transition of a machine from a state after a sequence of inputs followed by a last input. */
export const behavior: Behavior = (machine, state, inputs, lastInput) =>
  machine.structureMap(iteratedTransitionFunction(machine, state, inputs), lastInput).output;

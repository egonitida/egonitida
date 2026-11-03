import ExportTypeScript

namespace EgoNitida

namespace Machine

/-- A record of the successor state and the output of a transition. -/
@[export_typescript]
structure Outcome (State Output : Type) where
  /-- The state a machine transitions to. -/
  successorState : State
  /-- The value a machine produces for the outside as it transitions. -/
  output : Output

/-- A function that gives the successor state and the output of a machine from its current state and an input. -/
@[export_typescript]
abbrev StructureMap (State Input Output : Type) : Type :=
  (currentState : State) → (input : Input) → Outcome State Output

end Machine

/-- A state-based system that transitions upon inputs and produces an output with each transition. -/
@[export_typescript]
structure Machine (State Input Output : Type) where
  /-- The function that gives its successor state and output from its current state upon each input. -/
  structureMap : Machine.StructureMap State Input Output

namespace Machine

variable {State SourceState IntermediateState EarlierIntermediateState LaterIntermediateState
  TargetState Input Output : Type}

/-- A function that maps the states of one machine to the states of another and commutes with their structure maps. -/
@[ext]
structure Homomorphism (source : Machine SourceState Input Output)
    (target : Machine TargetState Input Output) where
  /-- The map from the states of the source to the states of the target. -/
  toFunction : SourceState → TargetState
  /-- The law that the target transitions from the image of a state to the image of its successor state in the source upon the same input and produces the same output. -/
  commutes : ∀ (currentState : SourceState) (input : Input),
    target.structureMap (toFunction currentState) input =
      { successorState := toFunction (source.structureMap currentState input).successorState,
        output := (source.structureMap currentState input).output }

namespace Homomorphism

variable {source : Machine SourceState Input Output} {target : Machine TargetState Input Output}

/-- The homomorphism that maps each state of a machine to itself. -/
def identity (machine : Machine State Input Output) : Homomorphism machine machine where
  toFunction state := state
  commutes _ _ := rfl

/-- The homomorphism that maps each state by one homomorphism and then by the other. -/
def composition {intermediate : Machine IntermediateState Input Output}
    (later : Homomorphism intermediate target) (earlier : Homomorphism source intermediate) :
    Homomorphism source target where
  toFunction state := later.toFunction (earlier.toFunction state)
  commutes currentState input := by
    rw [later.commutes, earlier.commutes]

/-- Following a homomorphism $h$ by the identity gives $h$, $\mathrm{id} \circ h = h$. -/
theorem identity_composition (homomorphism : Homomorphism source target) :
    composition (identity target) homomorphism = homomorphism :=
  Homomorphism.ext rfl

/-- Following the identity by a homomorphism $h$ gives $h$, $h \circ \mathrm{id} = h$. -/
theorem composition_identity (homomorphism : Homomorphism source target) :
    composition homomorphism (identity source) = homomorphism :=
  Homomorphism.ext rfl

/-- Composing three homomorphisms $f$, $g$, and $h$ in turn gives one homomorphism whichever pair of them is composed first, $h \circ (g \circ f) = (h \circ g) \circ f$. -/
theorem composition_associative
    {earlierIntermediate : Machine EarlierIntermediateState Input Output}
    {laterIntermediate : Machine LaterIntermediateState Input Output}
    (latest : Homomorphism laterIntermediate target)
    (middle : Homomorphism earlierIntermediate laterIntermediate)
    (earliest : Homomorphism source earlierIntermediate) :
    composition latest (composition middle earliest) =
      composition (composition latest middle) earliest :=
  Homomorphism.ext rfl

end Homomorphism

/-- A function that gives the state a machine reaches from a state after a sequence of inputs. -/
@[export_typescript]
def iteratedTransitionFunction (machine : Machine State Input Output) (state : State)
    (inputs : List Input) : State :=
  match inputs with
  | [] => state
  | input :: remainingInputs =>
    machine.iteratedTransitionFunction (machine.structureMap state input).successorState
      remainingInputs

/-- Iterating over no inputs leaves a state $s$ as it was, $\delta^*(s, \langle\rangle) = s$. -/
theorem iteratedTransitionFunction_nil (machine : Machine State Input Output) (state : State) :
    machine.iteratedTransitionFunction state [] = state :=
  rfl

/-- Iterating over two sequences $\sigma$ and $\tau$ in turn from a state $s$ reaches the state that iterating over their concatenation $\sigma \tau$ reaches, $\delta^*(s, \sigma \tau) = \delta^*(\delta^*(s, \sigma), \tau)$. -/
theorem iteratedTransitionFunction_append (machine : Machine State Input Output) (state : State)
    (earlierInputs laterInputs : List Input) :
    machine.iteratedTransitionFunction state (earlierInputs ++ laterInputs) =
      machine.iteratedTransitionFunction (machine.iteratedTransitionFunction state earlierInputs)
        laterInputs := by
  induction earlierInputs generalizing state with
  | nil => rfl
  | cons input remainingInputs inductionHypothesis => exact inductionHypothesis _

namespace Homomorphism

variable {source : Machine SourceState Input Output} {target : Machine TargetState Input Output}

/-- Mapping by a homomorphism $h$ the state that iterating over a sequence $\sigma$ from a state $s$ reaches gives the state that iterating over $\sigma$ from $h(s)$ reaches, $h(\delta^*(s, \sigma)) = \delta^*(h(s), \sigma)$. -/
theorem toFunction_iteratedTransitionFunction (homomorphism : Homomorphism source target)
    (state : SourceState) (inputs : List Input) :
    homomorphism.toFunction (source.iteratedTransitionFunction state inputs) =
      target.iteratedTransitionFunction (homomorphism.toFunction state) inputs := by
  induction inputs generalizing state with
  | nil => rfl
  | cons input remainingInputs inductionHypothesis =>
    simp only [iteratedTransitionFunction, homomorphism.commutes]
    exact inductionHypothesis _

end Homomorphism

/-- A function that gives the output of the last transition of a machine from a state after a sequence of inputs followed by a last input. -/
@[export_typescript]
def behavior (machine : Machine State Input Output) (state : State) (inputs : List Input)
    (lastInput : Input) : Output :=
  (machine.structureMap (machine.iteratedTransitionFunction state inputs) lastInput).output

namespace Homomorphism

variable {source : Machine SourceState Input Output} {target : Machine TargetState Input Output}

/-- Starting from the image under a homomorphism $h$ of a state $s$ gives the same output after a sequence $\sigma$ followed by a last input $i$ as starting from $s$, $\mathrm{beh}(h(s))(\sigma i) = \mathrm{beh}(s)(\sigma i)$. -/
theorem behavior_toFunction (homomorphism : Homomorphism source target) (state : SourceState)
    (inputs : List Input) (lastInput : Input) :
    target.behavior (homomorphism.toFunction state) inputs lastInput =
      source.behavior state inputs lastInput := by
  unfold behavior
  rw [← homomorphism.toFunction_iteratedTransitionFunction, homomorphism.commutes]

end Homomorphism

/-- A property of a machine into which every machine has exactly one homomorphism. -/
def IsFinal (machine : Machine State Input Output) : Prop :=
  ∀ {ArbitraryState : Type} (arbitrary : Machine ArbitraryState Input Output),
    Nonempty (Homomorphism arbitrary machine) ∧ Subsingleton (Homomorphism arbitrary machine)

/-- The machine whose states are the behaviors, each a function from a sequence of inputs followed by a last input to an output. -/
def final (Input Output : Type) : Machine (List Input → Input → Output) Input Output where
  structureMap currentState input :=
    { successorState := fun inputs lastInput => currentState (input :: inputs) lastInput,
      output := currentState [] input }

namespace Homomorphism

/-- The homomorphism from a machine to the final machine that maps each state to its behavior. -/
def toFinal (machine : Machine State Input Output) :
    Homomorphism machine (final Input Output) where
  toFunction := machine.behavior
  commutes _ _ := rfl

end Homomorphism

/-- Iterating over a sequence $\sigma$ in the final machine from a behavior $\varphi$ reaches the behavior that gives each sequence $\tau$ followed by a last input $i$ what $\varphi$ gives the concatenation $\sigma \tau$ followed by $i$, $\delta^*(\varphi, \sigma) = (\tau i \mapsto \varphi(\sigma \tau i))$. -/
theorem iteratedTransitionFunction_final (state : List Input → Input → Output)
    (inputs : List Input) :
    (final Input Output).iteratedTransitionFunction state inputs =
      fun laterInputs lastInput => state (inputs ++ laterInputs) lastInput := by
  induction inputs generalizing state with
  | nil => rfl
  | cons input remainingInputs inductionHypothesis => exact inductionHypothesis _

/-- The behavior of the final machine from a behavior $\varphi$ is $\varphi$, $\mathrm{beh}(\varphi) = \varphi$. -/
theorem behavior_final (state : List Input → Input → Output) :
    (final Input Output).behavior state = state := by
  funext inputs lastInput
  show (final Input Output).iteratedTransitionFunction state inputs [] lastInput =
    state inputs lastInput
  simp only [iteratedTransitionFunction_final, List.append_nil]

namespace Homomorphism

/-- Every homomorphism $h$ from a machine into the final machine maps each state to its behavior, $h = \mathrm{beh}$. -/
theorem eq_toFinal {machine : Machine State Input Output}
    (homomorphism : Homomorphism machine (final Input Output)) :
    homomorphism = toFinal machine := by
  apply Homomorphism.ext
  funext state inputs lastInput
  calc homomorphism.toFunction state inputs lastInput
      = (final Input Output).behavior (homomorphism.toFunction state) inputs lastInput := by
        rw [behavior_final]
    _ = machine.behavior state inputs lastInput :=
        homomorphism.behavior_toFunction state inputs lastInput

end Homomorphism

/-- Every machine has exactly one homomorphism into the final machine. -/
theorem isFinal_final : IsFinal (final Input Output) := by
  intro ArbitraryState arbitrary
  exact ⟨⟨Homomorphism.toFinal arbitrary⟩,
    ⟨fun first second => first.eq_toFinal.trans second.eq_toFinal.symm⟩⟩

end Machine

end EgoNitida

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

end Machine

end EgoNitida

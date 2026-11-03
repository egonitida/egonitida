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

end EgoNitida

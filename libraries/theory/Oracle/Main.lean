import EgoNitida.Machine
import Lean.Data.Json

namespace Oracle

/-- A type class that lists the values of a type the tests run over. -/
class Enumeration (Value : Type) where
  /-- The values, each once. -/
  values : List Value

/-- The greatest length of a sequence the tests run over. -/
def bound : Nat := 3

variable {Value First Second Argument Result State Output : Type} {size length states inputs : Nat}

instance : Enumeration (Fin size) where
  values := List.finRange size

instance [Enumeration First] [Enumeration Second] : Enumeration (First × Second) where
  values := (Enumeration.values : List First).flatMap fun first =>
    (Enumeration.values : List Second).map fun second => (first, second)

/-- A function that gives the sequences of one length over the values of a type. -/
def sequencesOfLength [Enumeration Value] : Nat → List (List Value)
  | 0 => [[]]
  | length + 1 => (Enumeration.values : List Value).flatMap fun value =>
    (sequencesOfLength length).map (value :: ·)

instance [Enumeration Value] : Enumeration (List Value) where
  values := (List.range (bound + 1)).flatMap sequencesOfLength

/-- A function that gives the vectors of one length over the values of a type. -/
def vectorsOfLength [Enumeration Value] : (length : Nat) → List (Vector Value length)
  | 0 => [⟨#[], rfl⟩]
  | length + 1 => (vectorsOfLength length).flatMap fun vector =>
    (Enumeration.values : List Value).map vector.push

instance [Enumeration Value] : Enumeration (Vector Value length) where
  values := vectorsOfLength length

instance [Enumeration State] [Enumeration Output] :
    Enumeration (EgoNitida.Machine.Outcome State Output) where
  values := (Enumeration.values : List (State × Output)).map fun (successorState, output) =>
    { successorState, output }

instance [Enumeration Output] : Enumeration (EgoNitida.Machine (Fin states) (Fin inputs) Output) where
  values := (Enumeration.values :
      List (Vector (Vector (EgoNitida.Machine.Outcome (Fin states) Output) inputs) states)).map
    fun table => { structureMap := fun state input => table[state][input] }

instance : Lean.ToJson (Fin size) where
  toJson element := Lean.toJson element.val

instance [Lean.ToJson State] [Lean.ToJson Output] :
    Lean.ToJson (EgoNitida.Machine.Outcome State Output) where
  toJson outcome := Lean.Json.mkObj [
    ("successorState", Lean.toJson outcome.successorState),
    ("output", Lean.toJson outcome.output)
  ]

instance [Lean.ToJson Output] : Lean.ToJson (EgoNitida.Machine (Fin states) (Fin inputs) Output) where
  toJson machine := Lean.Json.arr ((List.finRange states).map fun state =>
    Lean.Json.arr ((List.finRange inputs).map fun input =>
      Lean.toJson (machine.structureMap state input)).toArray).toArray

/-- A type class that gives the cases of a function the tests run over, each list of arguments with the value it gives. -/
class Cases (Value : Type) where
  /-- The lists of arguments, each with the value it gives. -/
  cases : Value → List (List Lean.Json × Lean.Json)

instance (priority := low) [Lean.ToJson Value] : Cases Value where
  cases value := [([], Lean.toJson value)]

instance [Enumeration Argument] [Lean.ToJson Argument] [Cases Result] : Cases (Argument → Result) where
  cases function := (Enumeration.values : List Argument).flatMap fun argument =>
    (Cases.cases (function argument)).map fun (arguments, value) =>
      (Lean.toJson argument :: arguments, value)

/-- A function that gives the JSON of the cases of a function. -/
def casesJson [Cases Value] (function : Value) : Lean.Json :=
  Lean.Json.arr ((Cases.cases function).map fun (arguments, value) =>
    Lean.Json.mkObj [("arguments", Lean.Json.arr arguments.toArray), ("value", value)]).toArray

/-- A machine of two states, two inputs, and two outputs. -/
abbrev SmallMachine := EgoNitida.Machine (Fin 2) (Fin 2) (Fin 2)

end Oracle

/-- A function that writes the values of the theory as JSON. -/
def main : IO Unit :=
  IO.println (Lean.Json.mkObj [
    ("iteratedTransitionFunction", Oracle.casesJson
      (EgoNitida.Machine.iteratedTransitionFunction :
        Oracle.SmallMachine → Fin 2 → List (Fin 2) → Fin 2)),
    ("behavior", Oracle.casesJson
      (EgoNitida.Machine.behavior : Oracle.SmallMachine → Fin 2 → List (Fin 2) → Fin 2 → Fin 2))
  ]).compress

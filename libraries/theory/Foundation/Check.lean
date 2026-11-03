import EgoNitida
import Lean.Util.CollectAxioms
import Lean.Compiler.ExternAttr
import Lean.Compiler.ImplementedByAttr

namespace Foundation

/-- The axioms of Lean a declaration of the theory may rest on. -/
def standardAxioms : List Lean.Name := [``propext, ``Quot.sound, ``Classical.choice]

/-- A function that gives each rule of the foundation a declaration breaks, as a sentence. -/
def violationsOf (name : Lean.Name) : Lean.CoreM (List String) := do
  let environment ← Lean.getEnv
  let axioms := (← Lean.collectAxioms name).toList.filter (!standardAxioms.contains ·)
  let kind := match environment.find? name with
    | some (.axiomInfo _) => [s!"`{name}` is an axiom."]
    | some (.opaqueInfo _) => [s!"`{name}` is opaque, so Lean never computes it."]
    | some info => if info.isUnsafe then [s!"`{name}` is unsafe."] else []
    | none => []
  return axioms.map (s!"`{name}` rests on the axiom `{·}`.") ++ kind ++
    (if Lean.isExtern environment name then [s!"`{name}` is computed outside Lean."] else []) ++
    (if (Lean.Compiler.getImplementedBy? environment name).isSome then
      [s!"`{name}` is computed by another declaration than the one Lean checks."] else []) ++
    (if Lean.isNoncomputable environment name then [s!"`{name}` is not computable."] else [])

end Foundation

run_meta do
  let environment ← Lean.getEnv
  let names := (environment.header.moduleNames.zip environment.header.moduleData).toList.flatMap
    fun (module, data) => if (`EgoNitida).isPrefixOf module then data.constNames.toList else []
  let violations ← (names.flatMapM Foundation.violationsOf : Lean.CoreM _)
  unless violations.isEmpty do
    throwError String.intercalate "\n" violations

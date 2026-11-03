import EgoNitida
import Declaration.TypeScript
import Declaration.Comment
import Declaration.Documentation

namespace Declaration

/-- A function that runs a computation of the theory in an environment, as a program runs it. -/
def runIn {α : Type} (environment : Lean.Environment) (computation : Lean.Meta.MetaM α) : IO α := do
  let (value, _) ← (computation.run' {} {}).toIO
    { fileName := "", fileMap := default } { env := environment }
  return value

end Declaration

/-- A function that writes the declarations of the theory marked `export_typescript` and the documentation of its modules into the directories it is given, and checks the documentation comments of the implementation. -/
def main (arguments : List String) : IO Unit := do
  let [typeScriptDirectory, documentationDirectory] := arguments
    | throw (IO.userError "The directories to write the declarations and the documentation into are missing.")
  Lean.initSearchPath (← Lean.findSysroot)
  let environment ← Lean.importModules #[{ module := `EgoNitida }] {}
  let markedModules := (environment.header.moduleNames.zip environment.header.moduleData).toList.filterMap
    fun (module, data) =>
      let marked := data.constNames.toList.filter (ExportTypeScript.tagAttribute.hasTag environment)
      if marked.isEmpty then none else some (module, marked)
  for (module, declarations) in markedModules do
    let text ← Declaration.runIn environment (Declaration.fileOf module declarations)
    IO.FS.writeFile (System.FilePath.mk typeScriptDirectory / s!"{Declaration.typeName module}.generated.ts") text
    let functions ← Declaration.runIn environment (Declaration.functionsOf declarations)
    let path := System.FilePath.mk typeScriptDirectory / s!"{Declaration.typeName module}.ts"
    let source ← if functions.isEmpty then pure "" else IO.FS.readFile path
    for (value, text) in functions do
      unless Declaration.commentAbove source value == some text do
        throw (IO.userError s!"{path}: `{value}` lacks the documentation comment of the theory, /** {text} */.")
  IO.FS.createDirAll documentationDirectory
  for (module, data) in environment.header.moduleNames.zip environment.header.moduleData do
    if (`EgoNitida).isPrefixOf module && module != `EgoNitida then
      let source ← IO.FS.readFile (System.FilePath.mk (module.toString.replace "." "/") |>.addExtension "lean")
      let text ← Declaration.runIn environment
        (Declaration.documentationOf module source data.constNames.toList)
      IO.FS.writeFile (System.FilePath.mk documentationDirectory / s!"{module}.md") text

import Declaration.TypeScript

namespace Declaration

/-- A function that gives the functions of a module marked `export_typescript`, each with its documentation comment. -/
def functionsOf (declarations : List Lean.Name) : Lean.Meta.MetaM (List (String × String)) := do
  let environment ← Lean.getEnv
  let functions := declarations.filter (isFunction environment)
  functions.mapM fun name => do
    let some text ← Lean.findDocString? environment name | throwError m!"{name} has no documentation comment."
    return (name.getString!, text.trimAscii.copy)

/-- A function that gives the text of a documentation comment, its delimiters and leading asterisks taken away. -/
def commentText (comment : String) : String :=
  let lines := comment.splitOn "\n" |>.map fun line =>
    (String.ofList (line.toList.dropWhile fun character => character == ' ' || character == '*')).trimAscii.copy
  (" ".intercalate (lines.filter (!·.isEmpty))).trimAscii.copy

/-- A function that gives the documentation comment that stands right above the export of a value in TypeScript, where one does. -/
def commentAbove (source value : String) : Option String :=
  match source.splitOn s!"export const {value}:" with
  | [before, _] =>
    match (before.splitOn "/**").getLast? with
    | some last =>
      match last.splitOn "*/" with
      | [inside, after] => if after.trimAscii.copy.isEmpty then some (commentText inside) else none
      | _ => none
    | none => none
  | _ => none

end Declaration

import Lean.DocString

namespace Declaration

/-- A function that gives the text of a source between two of its positions, each a line counted from one and a column counted from zero. -/
def sourceBetween (source : String) (start stop : Lean.Position) : String :=
  let lines := (source.splitOn "\n").drop (start.line - 1) |>.take (stop.line - start.line + 1)
  let lines := lines.zipIdx.map fun (line, index) =>
    let line := if index + 1 == lines.length then String.ofList (line.toList.take stop.column) else line
    if index == 0 then String.ofList (line.toList.drop start.column) else line
  "\n".intercalate lines

/-- A function that gives a declaration as its source writes it, without its documentation comment. -/
def withoutComment (text : String) : String :=
  if text.startsWith "/--" then
    match text.splitOn "-/" with
    | _ :: rest => ("-/".intercalate rest).trimAscii.copy
    | [] => text
  else text

/-- A function that gives the keyword a declaration is written with, the first word of its source after its attributes. -/
def keywordOf (text : String) : String :=
  let lines := (text.splitOn "\n").filter fun line => !line.trimAscii.copy.startsWith "@["
  match lines.head? with
  | some line => (line.trimAscii.copy.splitOn " ").head?.getD ""
  | none => ""

/-- A function that gives the name of a declaration as the documentation writes it, without the namespace of the theory. -/
def documentedName (name : Lean.Name) : String :=
  (name.replacePrefix `EgoNitida .anonymous).toString

/-- A function that writes a module of the theory as Markdown: its documentation, then every declaration with a documentation comment, in the order of its source, each as its source writes it with its documentation comment under it. -/
def documentationOf (module : Lean.Name) (source : String) (declarations : List Lean.Name) : Lean.Meta.MetaM String := do
  let environment ← Lean.getEnv
  let comments := (Lean.getModuleDoc? environment module).getD #[]
  let moduleText := "\n\n".intercalate (comments.toList.map fun comment =>
    "\n".intercalate ((comment.doc.trimAscii.copy.splitOn "\n").filter (!·.startsWith "# ")))
  let documented ← declarations.filterMapM fun name => do
    if name.isInternal || environment.isProjectionFn name then return none
    let some text ← Lean.findDocString? environment name | return none
    let some ranges ← Lean.findDeclarationRanges? name | return none
    return some (name, text.trimAscii.copy, ranges.range)
  let ordered := documented.mergeSort fun (_, _, first) (_, _, second) => first.pos.line ≤ second.pos.line
  let sections := ordered.map fun (name, text, range) =>
    let code := withoutComment (sourceBetween source range.pos range.endPos)
    s!"## {keywordOf code} {documentedName name}\n\n```lean\n{code}\n```\n\n{text}\n"
  return s!"# {module}\n\n{moduleText.trimAscii.copy}\n\n{"\n".intercalate sections}"

end Declaration

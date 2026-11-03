import ExportTypeScript
import Lean.DocString

namespace Declaration

/-- A side of a function type on which a type parameter occurs. -/
inductive Polarity where
  /-- The side of what the function gives. -/
  | positive
  /-- The side of what the function takes. -/
  | negative
  deriving BEq

/-- A function that gives the polarity an occurrence at one polarity has inside a context at another. -/
def Polarity.within : Polarity → Polarity → Polarity
  | .positive, inner => inner
  | .negative, .positive => .negative
  | .negative, .negative => .positive

/-- A function that gives the name of a type in TypeScript, the last component of its name in Lean, capitalized. -/
def typeName (name : Lean.Name) : String :=
  name.getString!.capitalize

/-- A function that gives the name of a parameter in TypeScript from its binder, refused where Lean leaves it unnamed. -/
def binderName (name : Lean.Name) : Lean.Meta.MetaM String := do
  if name.isAnonymous || name.hasMacroScopes || name.isInaccessibleUserName then
    throwError "A binder without a name has no name in TypeScript."
  return name.toString

/-- A function that gives the type parameters of a declaration and the type that remains, peeled from its leading binders over types. -/
def typeParameters (type : Lean.Expr) : Lean.Meta.MetaM (List String × List String × Lean.Expr) :=
  peelBinders [] [] type
where
  /-- A function that peels the binders over types one at a time, the names innermost first and the parameters in order. -/
  peelBinders (names parameters : List String) : Lean.Expr → Lean.Meta.MetaM (List String × List String × Lean.Expr)
    | .forallE name (.sort _) body _ | .lam name (.sort _) body _ => do
      let parameterName ← binderName name
      peelBinders (parameterName :: names) (parameters ++ [parameterName]) body
    | type => return (names, parameters, type)

mutual

/-- A function that writes a type of the theory as a type of TypeScript, given the names of its bound variables, innermost first. -/
partial def typeOf (names : List String) (type : Lean.Expr) : Lean.Meta.MetaM String := do
  match type with
  | .bvar index =>
    match names[index]? with
    | some name => return name
    | none => throwError "A bound variable has no name in TypeScript."
  | .forallE .. => functionOf names [] type
  | _ =>
    let arguments ← type.getAppArgs.toList.mapM (typeOf names)
    match type.getAppFn, arguments with
    | .const ``List _, [element] => return s!"ReadonlyArray<{element}>"
    | .const name _, arguments =>
      unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name do
        throwError m!"{name} has no declaration in TypeScript."
      if arguments.isEmpty then return typeName name
      return s!"{typeName name}<{", ".intercalate arguments}>"
    | _, _ => throwError m!"{type} has no type in TypeScript."

/-- A function that writes a function type as TypeScript writes it, its explicit binders gathered as the parameters of one function. -/
partial def functionOf (names parameters : List String) (type : Lean.Expr) : Lean.Meta.MetaM String := do
  match type with
  | .forallE name domain body .default =>
    let parameterName ← binderName name
    let parameter := s!"{parameterName}: {← typeOf names domain}"
    functionOf (parameterName :: names) (parameters ++ [parameter]) body
  | .forallE .. => throwError "An implicit binder inside a type has no form in TypeScript."
  | _ => return s!"({", ".intercalate parameters}) => {← typeOf names type}"

end

mutual

/-- A function that gives the polarities at which each type parameter of a declaration occurs, by the name of the parameter. -/
partial def variancesOf (name : Lean.Name) : Lean.Meta.MetaM (List (List Polarity)) := do
  if name == ``List then return [[.positive]]
  let environment ← Lean.getEnv
  unless ExportTypeScript.tagAttribute.hasTag environment name do
    throwError m!"{name} has no declaration in TypeScript."
  let some declaration := environment.find? name | throwError m!"{name} is not declared."
  let (_, parameters, _) ← typeParameters declaration.type
  let occurrencesOfParameters ← if Lean.isStructure environment name then
      (Lean.getStructureFields environment name).toList.flatMapM fun field => do
        let some projection := environment.find? (name ++ field) | return []
        let (names, remaining) ← peel [] projection.type
        occurrences names .positive remaining
    else
      let some value := declaration.value? | throwError m!"{name} has no value."
      let (names, _, body) ← typeParameters value
      occurrences names .positive body
  return parameters.map fun parameter =>
    occurrencesOfParameters.filterMap fun (occurrence, polarity) => if occurrence == parameter then some polarity else none

/-- A function that gives every occurrence of a type parameter in a type, as its name and polarity. -/
partial def occurrences (names : List String) (polarity : Polarity) (type : Lean.Expr) :
    Lean.Meta.MetaM (List (String × Polarity)) := do
  match type with
  | .bvar index => return (names[index]?.map fun name => [(name, polarity)]).getD []
  | .forallE name domain body _ =>
    return (← occurrences names (polarity.within .negative) domain) ++
      (← occurrences (name.toString :: names) polarity body)
  | _ =>
    let .const name _ := type.getAppFn | return []
    let variances ← variancesOf name
    let arguments := type.getAppArgs.toList
    (arguments.zip variances).flatMapM fun (argument, argumentPolarities) =>
      argumentPolarities.flatMapM fun argumentPolarity =>
        occurrences names (polarity.within argumentPolarity) argument

/-- A function that peels every leading binder of a type, the names innermost first. -/
partial def peel (names : List String) : Lean.Expr → Lean.Meta.MetaM (List String × Lean.Expr)
  | .forallE name _ body _ => peel (name.toString :: names) body
  | type => return (names, type)

end

/-- A function that gives the variance of a type parameter as TypeScript annotates it. -/
def annotation (parameter : String) (polarities : List Polarity) : String :=
  match polarities.contains .negative, polarities.contains .positive with
  | true, true => s!"in out {parameter}"
  | true, false => s!"in {parameter}"
  | false, true => s!"out {parameter}"
  | false, false => parameter

/-- A function that gives the documentation comment of a declaration as TypeScript writes it, refused where the declaration has none. -/
def typeScriptComment (name : Lean.Name) (indentation : String) : Lean.Meta.MetaM String := do
  let some text ← Lean.findDocString? (← Lean.getEnv) name | throwError m!"{name} has no documentation comment."
  return s!"{indentation}/** {text.trimAscii.copy} */\n"

/-- A function that gives the type parameters of a declaration, each with the variance its occurrences give it. -/
def genericsOf (name : Lean.Name) (parameters : List String) : Lean.Meta.MetaM String := do
  let variances ← variancesOf name
  return ", ".intercalate ((parameters.zip variances).map fun (parameter, polarities) =>
    annotation parameter polarities)

/-- A function that gives the line a declaration starts on in its source. -/
def lineOf (name : Lean.Name) : Lean.Meta.MetaM Nat := do
  let some ranges ← Lean.findDeclarationRanges? name | throwError m!"{name} has no place in its source."
  return ranges.range.pos.line

/-- A function that gives the words of a name in camel case, in lower case and apart. -/
def wordsOf (name : String) : String :=
  name.foldl (fun words character =>
    if character.isUpper && !words.isEmpty then words ++ " " ++ character.toLower.toString
    else words ++ character.toLower.toString) ""

/-- A function that writes one declaration of the theory as a declaration of TypeScript, `primary` where it names its module. -/
def declarationOf (primary : Bool) (name : Lean.Name) : Lean.Meta.MetaM String := do
  let environment ← Lean.getEnv
  let some declaration := environment.find? name | throwError m!"{name} is not declared."
  let (_, parameters, remaining) ← typeParameters declaration.type
  if Lean.isStructure environment name then
    let fields ← (Lean.getStructureFields environment name).toList.mapM fun field => do
      let some projection := environment.find? (name ++ field) | throwError m!"{field} is not declared."
      let (fieldNames, fieldType) ← peel [] projection.type
      return s!"{← typeScriptComment (name ++ field) "  "}  readonly {field}: {← typeOf fieldNames fieldType};\n"
    let generics ← genericsOf name parameters
    let arguments := ", ".intercalate parameters
    let words := wordsOf (typeName name)
    let article := if words.toList.head?.any ("aeiou".toList.contains ·) then "an" else "a"
    let make := if primary then "make" else s!"make{typeName name}"
    let fieldsName := (typeName name).decapitalize
    return s!"{← typeScriptComment name ""}export interface {typeName name}<{generics}> \{\n{String.join fields}}\n\n" ++
      s!"/** Creates {article} {words} from its fields. */\n" ++
      s!"export const {make} = <{arguments}>({fieldsName}: {typeName name}<{arguments}>): {typeName name}<{arguments}> => {fieldsName};\n"
  if remaining matches .sort _ then
    let some value := declaration.value? | throwError m!"{name} has no value."
    let (bodyNames, _, body) ← typeParameters value
    return s!"{← typeScriptComment name ""}export type {typeName name}<{← genericsOf name parameters}> = {← typeOf bodyNames body};\n"
  let (functionNames, functionParameters, functionType) ← implicitParameters [] [] declaration.type
  let functionGenerics := if functionParameters.isEmpty then "" else s!"<{", ".intercalate functionParameters}>"
  return s!"{← typeScriptComment name ""}export type {typeName name} = {functionGenerics}{← functionOf functionNames [] functionType};\n"
where
  /-- A function that peels the implicit binders over types of a function, the names innermost first and the parameters in order. -/
  implicitParameters (names parameters : List String) : Lean.Expr → Lean.Meta.MetaM (List String × List String × Lean.Expr)
    | .forallE name (.sort _) body .implicit => do
      let parameterName ← binderName name
      implicitParameters (parameterName :: names) (parameters ++ [parameterName]) body
    | type => return (names, parameters, type)

/-- A function that tells whether a declaration is a function, neither a structure nor a type. -/
def isFunction (environment : Lean.Environment) (name : Lean.Name) : Bool :=
  !Lean.isStructure environment name &&
    !((environment.find? name).map fun declaration => declaration.type.getForallBody matches .sort _).getD false

/-- A function that gives the documentation comments of a module as one comment of a file in TypeScript, or nothing where the module has none. -/
def moduleCommentOf (module : Lean.Name) : Lean.Meta.MetaM String := do
  let some comments := Lean.getModuleDoc? (← Lean.getEnv) module | return ""
  if comments.isEmpty then return ""
  let text := "\n\n".intercalate (comments.toList.map fun comment => comment.doc.trimAscii.copy)
  let lines := (text.splitOn "\n").map fun line => if line.isEmpty then " *" else s!" * {line}"
  return s!"/**\n{"\n".intercalate lines}\n *\n * @packageDocumentation\n */\n\n"

/-- A function that writes every declaration of a module marked `export_typescript`, the one that names the module first and the rest in the order of its source. -/
def fileOf (module : Lean.Name) (declarations : List Lean.Name) : Lean.Meta.MetaM String := do
  let lines ← declarations.mapM fun name => return (name, ← lineOf name)
  let ordered := (lines.mergeSort fun first second => first.snd ≤ second.snd).map Prod.fst
  let named := ordered.filter fun name => typeName name == typeName module
  let rest := ordered.filter fun name => typeName name != typeName module
  let namedTexts ← named.mapM (declarationOf true)
  let restTexts ← rest.mapM (declarationOf false)
  let texts := namedTexts ++ restTexts
  let functions := ordered.filter (isFunction (← Lean.getEnv))
  let reexport := if functions.isEmpty then "" else
    s!"\nexport \{ {", ".intercalate (functions.map Lean.Name.getString!)} } from '#src/{typeName module}';\n"
  return s!"{← moduleCommentOf module}{"\n".intercalate texts}{reexport}"

end Declaration

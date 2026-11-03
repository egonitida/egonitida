import Lean.Attributes

namespace ExportTypeScript

/-- An attribute that marks a declaration to write as TypeScript. -/
initialize tagAttribute : Lean.TagAttribute ←
  Lean.registerTagAttribute `export_typescript "mark a declaration to write as TypeScript"

end ExportTypeScript

---
name: copyedit
description: Brings every text into line with one set of rules. Use this skill before naming or renaming anything, such as a class, a function, a variable, or a file, and before writing or editing any comment or page, even when the task is a change to code that never mentions naming or wording. Use it as well when asked to audit, check, review, or copyedit a text against these rules.
---

## References

Read `references/language.md` before writing or auditing any text of any kind, such as a page, code, or a comment, as every text is written in words and names the things it speaks of. Read beside it the reference for the kind of text, as each kind has rules that hold for that kind alone:

- `references/comments.md` for any comment, such as one on a module, a declaration, or a line of code.
- `references/pages.md` for any page of documentation, such as one in a repository or on a website.

## Writing

Whenever the request is not an audit, check the text once it is written by the steps of Auditing, fix every finding, and repeat until the steps find nothing. Leave each uncertainty as it is, and name it in the reply.

## Auditing

When the request is to audit, check, or review a text, given as a path to a file, a range of lines in it, or the text itself, report on it and change no file. Without a text, ask for one.

1. Split the text into paragraphs and sentences, or, in code, into names and comments.
2. Check every sentence and every name against every rule of the references read, and read the code a comment stands on to check what the comment states. Then check the rules that speak of the text as a whole.
3. Try to refute every finding against the words of the rule it breaks. Drop what does not survive, and keep what cannot be decided as uncertain.
4. Give every finding a proposal that keeps the meaning of the text and breaks no rule.

Report only what breaks a rule of the references, and reply with the report alone, in the form below. Leave out a table without rows, and write "Auditing the text yielded no findings and no uncertainties." alone when the audit yields none.

```markdown
Auditing the text yielded <number> findings and <number> uncertainties.

## Findings

| Place   | Rule | Current   | Proposal   |
| ------- | ---- | --------- | ---------- |
| <place> | <id> | <current> | <proposal> |

## Uncertainties

| Place   | Rule | Current   | Reason   |
| ------- | ---- | --------- | -------- |
| <place> | <id> | <current> | <reason> |
```

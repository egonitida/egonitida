---
name: copyedit
description: Brings every text into line with one set of rules. Use this skill before naming or renaming anything and before writing or editing any comment or page, even when the task is a change to code that never mentions naming or wording. Names include those of classes, functions, variables, and files. Use this skill as well when asked to audit, check, review, or copyedit a text against these rules.
---

## Reference

Read `references/language.md` before writing or auditing any text, as every text is written in words and names the things it speaks of. Read beside `references/language.md` the reference for the kind of text, as each kind has rules that hold for that kind alone:

- `references/comments.md` for any comment, such as one on a module, a declaration, or a line of code.
- `references/pages.md` for any page of documentation, such as one in a repository or on a website.

## Writing

Whenever the request is not an audit, write the text, check it by the steps of Auditing, fix every finding, and repeat the check while it still finds something. Leave each uncertainty as it is, and name it in the reply.

## Auditing

When the request is to audit, check, or review a text, report on the text and change no file. Take the text as a path to a file, a range of lines in the file, or the text itself, and ask for a text where the request gives none.

1. Split the text into paragraphs and sentences, and split code into names and comments.
2. Check every sentence and every name against every rule of the references read, and read the code a comment stands on to check what the comment states. Then check the rules that speak of the text as a whole.
3. Try to refute every finding against the words of the rule it breaks. Drop every finding the rule refutes, and keep as uncertain every finding the rule leaves open.
4. Give every finding a proposal that keeps the meaning of the text and breaks no rule.

Report only what breaks a rule of the references, and reply with the report alone, in the form below. Leave out every table that has no rows. Write `Auditing the text yielded no findings and no uncertainties.` alone when the audit finds nothing.

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

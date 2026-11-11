---
name: audit-formalization
description: Audits a module of a formalization in Lean against the reference the module formalizes and reports what is missing, what is extra, and what differs, item by item from the scope of the module. Use this skill when asked to audit, check, or compare a formalization against its book or paper.
---

## Input

Audit the file `<Module>.lean` of a module against the sections of the reference that the module cites. Read the reference in its PDF outside the repository, as the PDF may be under copyright. The reference decides every question of mathematics, and the module answers to the reference wherever no documented deviation covers a difference.

## Reading

Read the reference with the reader in the directory `scripts` of this skill, which writes the pages of a PDF as text and as images. Install the dependencies of the reader once with `npm install --prefix <skill>/scripts`, and then take two steps, with `<scratch>` standing for a directory outside the repository:

1. Extract the text of every page into a file of its own, named by the number of the page in the PDF. Search the files for the heading of every cited section, and take the pages from the page where the section begins to the page where the next section begins, as the printed page numbers may differ from the numbers in the PDF:

   ```bash
   node <skill>/scripts/Reader.ts text <reference.pdf> <scratch>/text
   ```

2. Render the pages of the cited sections as images, and take every statement and formula from the images, as extracted text corrupts formulas:

   ```bash
   node <skill>/scripts/Reader.ts image <reference.pdf> <scratch>/image <first>-<last> ...
   ```

## Auditing

The module states the general definitions of the reference for one functor alone, so the scope holds the items of the cited sections that hold for that functor. Decide whether the module states exactly the items in scope, and report on the module without changing a file.

1. Decide the scope from the cited sections. Keep every item in the scope however minor the item seems, as an auditor who narrows the scope hides what the module misses. Leave an item out only when a record of a decision or an instruction of the repository excludes the item, or when the standard library of Lean already states the item. Count every item outside the cited sections that an item in scope depends on as a scope gap.
2. Map the items in scope to the declarations and the declarations to the items. An item without a declaration is missing, and a declaration without an item is extra unless a record of a decision or an instruction of the repository requires the declaration.
3. Compare every item with its declaration: the statement at the same strength, the name as the term of the reference, the documentation comment in the notation of the reference, and the shape and the citation as the instructions of the repository require. Count a difference as a documented deviation only when a record of a decision or an instruction of the repository covers the whole difference, and as a finding otherwise.
4. Try to refute every finding against its page, as a wrong finding leads to a wrong change of the module. Drop every finding the page refutes, and keep as uncertain every finding the page leaves open.

Reply with the report alone, in the form below. Order the findings by severity, and give every finding the smallest change that fixes the module. Cite every item by its number and its printed page, as the printed page holds in every copy of the edition. Leave out every table that has no rows.

```markdown
Auditing <module> yielded <number> findings, <number> scope gaps, and <number> uncertainties.

## Scope

| Item   | Page   | Verdict                                     |
| ------ | ------ | ------------------------------------------- |
| <item> | <page> | <in scope, or out of scope with the reason> |

## Coverage

| Item   | Page   | Declaration   | Verdict                                                                  |
| ------ | ------ | ------------- | ------------------------------------------------------------------------ |
| <item> | <page> | <declaration> | <match, documented deviation with its record or instruction, or finding> |

## Findings

| Item   | Page   | Declaration   | Reference              | Module                        | Proposal   |
| ------ | ------ | ------------- | ---------------------- | ----------------------------- | ---------- |
| <item> | <page> | <declaration> | <what the item states> | <what the declaration states> | <proposal> |

## Scope gaps

| Item   | Page   | Needed by       |
| ------ | ------ | --------------- |
| <item> | <page> | <item in scope> |

## Uncertainties

| Item   | Page   | Declaration   | Reason   |
| ------ | ------ | ------------- | -------- |
| <item> | <page> | <declaration> | <reason> |

## Omissions

| Omission                          | Reason   |
| --------------------------------- | -------- |
| <what the audit leaves unchecked> | <reason> |
```

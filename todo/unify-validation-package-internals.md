---
title: Unify validation package internals
priority: medium
area: architecture
---

# Unify validation package internals

## Problem

`@prelude/assert`, `@prelude/predicate`, and `@prelude/refute` independently implement nearly the same primitive, object, array, tuple, record, union, exact, and optional combinators. Their APIs and error models differ, so fixes and features must be repeated and can drift. The duplicated surface already includes slightly different naming and path/error behavior.

## Work

- Define one internal schema/validator representation with interpreters for boolean predicates, structured results, and throwing assertions.
- Preserve tree-shakeable public entry points and infer output types without introducing runtime coupling between public packages unless intentional.
- Create a behavior matrix for common combinators, coercion policy, error paths, exactness, unions, and custom validators.
- Migrate incrementally with compatibility tests and document any deliberate semantic differences.

## Acceptance criteria

- Shared combinator behavior is implemented once and exercised against all three public modes.
- Equivalent validators infer equivalent output types and report consistent paths.
- Public breaking changes, if any, are isolated to a planned major release with migration notes.

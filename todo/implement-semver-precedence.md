---
title: Implement SemVer 2.0 precedence
priority: high
area: semver
---

# Implement SemVer 2.0 precedence

## Problem

The current comparator compares `prerelease` and `build` as ordinary strings. This violates SemVer 2.0 precedence:

- a stable `1.0.0` is currently sorted before `1.0.0-alpha` in ascending order;
- `alpha.10` is ordered before `alpha.2` lexically;
- build metadata affects ordering even though SemVer says it must be ignored.

The existing descending-order test encodes the incorrect stable-versus-prerelease behavior.

## Work

- Compare major, minor, and patch numerically.
- Treat absence of a prerelease as higher precedence than any prerelease.
- Compare dot-separated prerelease identifiers using numeric-versus-alphanumeric SemVer rules.
- Ignore build metadata for precedence while preserving it during parsing.
- Add the complete precedence example from the SemVer 2.0 specification and property checks for comparator laws.

## Acceptance criteria

- Sorting matches the SemVer 2.0 precedence rules.
- `cmp` is antisymmetric and transitive for generated valid versions.
- `stringCmp`, `stringDsc`, parsed comparison, and documentation agree.

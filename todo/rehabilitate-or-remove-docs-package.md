---
title: Rehabilitate or remove the docs package
priority: medium
area: docs
---

# Rehabilitate or remove the docs package

## Problem

`@prelude/docs` is included as a public workspace package but has no README or tests and intentionally skips its build. Its `quick-doc` script invokes `ts-node`, which is not declared, has no shebang, forwards only one argument, and is not exposed through a manifest `bin` entry. The HTML generator writes into a fixed relative directory and injects remote, unpinned stylesheets.

## Work

- Decide whether this is an internal documentation tool or a supported public package.
- If retained, expose a real CLI, declare all runtime dependencies, use the shared build layout, and add fixture-based tests.
- Make input/output paths explicit, deterministic, and safe for nested package documentation.
- Decide how raw HTML, syntax highlighting, and offline styles are handled.
- If superseded, remove the package and replace any remaining workflow with a maintained root script.

## Acceptance criteria

- The documented command works from a clean install without undeclared tools.
- Generated output is deterministic and tested, or the unused package is removed.
- The package is not presented as publishable while its build is skipped.

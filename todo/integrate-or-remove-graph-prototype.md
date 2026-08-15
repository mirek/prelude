---
title: Integrate or remove the graph prototype
priority: medium
area: graph
---

# Integrate or remove the graph prototype

## Problem

`packages/graph` is not a workspace package: it has no manifest, build configuration, README, tests, or root index entry, and the root TypeScript config explicitly excludes it. Its two source files define incompatible `Graph` representations, so there is no coherent API to finish incrementally.

## Work

- Decide whether graph functionality belongs in Prelude.
- If retained, choose one representation and define directed/undirected edges, identity, weights, mutation/persistence, and traversal contracts.
- Add a normal package manifest, shared TypeScript configuration, exports, tests, documentation, and CI coverage.
- If it is only abandoned exploration, delete it rather than keeping uncompiled code in the monorepo.

## Acceptance criteria

- No source directory under `packages/` is silently excluded from workspace verification.
- A retained graph package has one public model and tests for its advertised operations; otherwise the prototype is removed.

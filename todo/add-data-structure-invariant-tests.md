---
title: Add invariant tests for core data structures
priority: medium
area: testing
---

# Add invariant tests for core data structures

## Problem

The most failure-prone algorithms rely mainly on example tests. Red-black-tree deletion still contains unresolved comments and invariant-error branches; channel/select code has many state combinations; and range-set and radix-trie operations have large combinatorial input spaces. High aggregate line coverage does not establish ordering, balancing, conservation, or concurrency invariants.

## Work

- Add seeded property tests that compare red-black trees, bags, maps, tries, range sets, sorted arrays, queues, and channels with simple reference models.
- Check red-black color/height/order/count invariants after every generated operation.
- Check algebraic laws where applicable: union/intersection identities, comparator laws, and insert/delete round trips.
- Generate operation traces and shrink failures to a minimal reproducible sequence.
- Run a bounded deterministic set in CI and a larger scheduled stress suite separately.

## Acceptance criteria

- Each complex structure has explicit invariant checks independent of its implementation.
- A failure reports the seed and minimal operation trace.
- Known edge domains—empty values, duplicates, extreme counts, close/error races, and adjacent ranges—are represented.

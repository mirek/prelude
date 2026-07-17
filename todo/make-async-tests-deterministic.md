---
title: Make asynchronous tests deterministic
priority: high
area: testing
---

# Make asynchronous tests deterministic

## Problem

Several concurrency tests depend on `Math.random()`, multi-second sleeps, and eventual polling. Three tests pass a numeric timeout as the third argument to `node:test`; current Node types correctly reject this signature, so the intended timeout is ignored. The full suite consequently takes much longer than necessary and can pass or fail based on scheduling luck.

## Work

- Replace random delays with controlled deferred promises, barriers, or a fake clock.
- Pass `{ timeout }` in the supported `node:test` argument position.
- Await every spawned task and assert cleanup rather than sleeping long enough and counting results.
- Add focused race tests for cancellation, close, error, and backpressure paths.
- Keep optional stress tests separate from the deterministic default suite and make their random seed reproducible.

## Acceptance criteria

- Library and test TypeScript projects compile under the supported Node types.
- The default test suite has no unseeded randomness or correctness assertions based only on wall-clock sleeps.
- No test leaves timers, promises, listeners, channels, or workers active after completion.
- Stress failures print the seed needed to reproduce them.

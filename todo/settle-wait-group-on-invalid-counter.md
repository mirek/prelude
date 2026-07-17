---
title: Settle WaitGroup waiters on invalid counters
priority: high
area: wait-group
---

# Settle `WaitGroup` waiters on invalid counters

## Problem

The `WaitGroup` documentation says waiting promises reject when the counter becomes negative. The implementation instead throws synchronously from `done()`/`add()` and leaves already registered waiters in `#waiters`, so they can remain pending forever. The negative counter is retained, making subsequent behavior harder to recover or reason about.

## Work

- Define whether counter underflow is rejected atomically or transitions the group into a terminal failed state.
- Settle all existing waiters according to that contract.
- Validate constructor and delta inputs, including non-integers and non-finite values.
- Define behavior for `add`, `done`, `wait`, and `reject` after settlement.

## Acceptance criteria

- No invalid counter transition leaves a pending waiter.
- Underflow, explicit rejection, zero, repeated waits, and reuse behavior have deterministic tests.
- Public documentation and runtime behavior agree.

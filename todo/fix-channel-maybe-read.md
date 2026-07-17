---
title: Fix Channel.maybeRead
priority: high
area: channel
---

# Fix `Channel.maybeRead`

## Problem

`Channel.maybeRead()` reverses the `IteratorResult` branches:

- for a successful read (`done` is false), it returns `undefined`;
- for a completed channel (`done` is true), it returns `result.value`.

A buffered channel containing `42` therefore produces `undefined` from `maybeRead()`.

## Work

- Return the yielded value when the read succeeds and `undefined` when the channel is closed.
- Decide and document how an actual queued `undefined` value is distinguished from channel completion, or constrain the API if it cannot be distinguished.
- Audit `read`, `next`, `return`, and close behavior for the same branch inversion.

## Acceptance criteria

- Tests cover buffered and unbuffered values, queued `undefined`, waiting readers, and closed channels.
- `maybeRead()` returns the queued value in the success case.
- The public documentation states the completion and `undefined` semantics precisely.

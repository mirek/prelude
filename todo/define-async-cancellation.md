---
title: Define cancellation for asynchronous utilities
priority: medium
area: async
---

# Define cancellation for asynchronous utilities

## Problem

Long-lived operations across async-generator, channel, emitter, function, serial-queue, progress, and remote-clock use different cleanup mechanisms and generally cannot accept an `AbortSignal`. Consumers must build ad hoc races around timers and promises, which can leave queued work, listeners, or interval resources alive after the caller no longer needs the result.

## Work

- Define a small shared cancellation convention based on `AbortSignal` and standard abort errors.
- Thread it through sleep/timer helpers, event waits, channel selection, queue operations, and concurrent generator transforms where cancellation is meaningful.
- Ensure iterator `return()` and abort propagate upstream and release downstream resources.
- Specify whether in-flight work is awaited, abandoned, or rejected and how partial results are handled.

## Acceptance criteria

- Long-lived public operations either support cancellation or explicitly document why they are not cancellable.
- Aborting removes listeners, clears timers, unblocks pending operations, and does not produce unhandled rejections.
- Cross-package cancellation behavior and error identity are consistent.

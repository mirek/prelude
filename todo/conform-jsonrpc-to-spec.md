---
title: Conform JSON-RPC handling to the 2.0 specification
priority: high
area: jsonrpc
---

# Conform JSON-RPC handling to the 2.0 specification

## Problem

The JSON-RPC package recognizes only a narrow, incompatible subset of JSON-RPC 2.0. It requires `params`, accepts only numeric IDs, adds a nonstandard `severity` field to errors, cannot process batches, silently ignores calls without a handler, and routes parse/validation failures to a local exception callback rather than sending standard protocol errors. `sendCall` only confirms transport delivery; it does not correlate a response or handle timeout/cancellation.

The WebSocket-like handler also assumes message payloads are strings, while common WebSocket implementations deliver buffers or event objects.

## Work

- Model request, notification, success, and error objects as explicit public types.
- Accept omitted `params`, positional or named params, and string or numeric IDs.
- Implement the standard error codes and `{ code, message, data? }` shape.
- Return Parse Error, Invalid Request, and Method Not Found responses where required; never respond to notifications.
- Support batches, including mixed requests/notifications and an empty-batch error.
- Add a client abstraction that allocates IDs, correlates responses, rejects remote errors, and cleans up on timeout, abort, close, or send failure.
- Normalize supported transport payloads behind a small adapter.

## Acceptance criteria

- A conformance suite covers all normative examples from the JSON-RPC 2.0 specification.
- Valid requests without `params` and with string IDs are accepted.
- Invalid JSON and invalid request objects receive standard responses.
- Pending calls cannot leak after timeout, abort, transport close, or duplicate/unknown responses.

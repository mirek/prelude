---
title: Complete XML parser conformance
priority: medium
area: xml
---

# Complete XML parser conformance

## Problem

The XML package exposes `parse` as an XML parser but implements only a partial grammar. Its main element test is skipped, a normal `<!DOCTYPE html>` is not supported because the doctype parser requires `]>`, entity and character references are not decoded, namespace handling records prefixes rather than resolved namespaces, and Unicode/name rules are approximated with broad character ranges.

Malformed-input behavior and the exact supported XML subset are not documented.

## Work

- Decide whether to implement XML 1.0 conformance or explicitly expose a smaller format under a less general contract.
- Cover elements, attributes, mixed content, comments, CDATA, processing instructions, ordinary and internal-subset doctypes, references, namespaces, and Unicode names.
- Reject mismatched tags, duplicate attributes, invalid characters, trailing content, and unterminated constructs with useful location information.
- Keep external entity resolution disabled by default and document security/resource limits.
- Unskip and update the element tests; add differential fixtures against a mature parser for the supported subset.

## Acceptance criteria

- No core parser behavior remains skipped.
- The README states the supported XML version/features and security defaults.
- Valid fixtures round-trip to the documented AST and invalid fixtures fail at a stable location.

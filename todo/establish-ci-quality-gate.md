---
title: Establish a continuous-integration quality gate
priority: critical
area: ci
---

# Establish a continuous-integration quality gate

## Problem

The repository has no checked-in CI workflow. Broken package-local TypeScript builds, invalid test signatures, skipped tests, and publish-time omissions can therefore reach `main` even though `pnpm lint` and the narrow root TypeScript program succeed.

## Work

- Add a GitHub Actions workflow using a frozen pnpm install and the pinned package manager version.
- Run lint, full library/test type-checking, the complete test suite, package builds, and tarball validation.
- Test the declared minimum and current Node versions where behavior differs.
- Cache pnpm safely without weakening lockfile verification.
- Cancel superseded runs and expose one required aggregate check suitable for branch protection.

## Acceptance criteria

- Pull requests and pushes to `main` run the same documented verification command developers use locally.
- No job depends on generated artifacts left by an earlier job.
- A type error in a package test, a broken package export, and a failing test each make the workflow fail.
- The root README documents the exact local equivalent of CI.

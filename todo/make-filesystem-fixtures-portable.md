---
title: Make filesystem fixtures portable
priority: high
area: fs
---

# Make filesystem fixtures portable

## Problem

The DFS test commits symbolic links as fixtures. In the audited checkout, the transport rewrote their relative targets to `/rsyncd-munged/...`, immediately dirtied the worktree, and made the DFS test follow a nonexistent path. Similar failures occur when Git symlink support is disabled, on some Windows setups, or when repository archives materialize links differently.

## Work

- Create symlink fixtures inside a temporary directory during the test and clean them afterward.
- Detect and explicitly skip only the symlink-specific cases on platforms that cannot create them.
- Add cases for relative links, directory cycles, dangling links, and the documented follow/no-follow policy.
- Ensure traversal cannot escape the requested root accidentally through a link.

## Acceptance criteria

- A fresh checkout is clean before and after the test suite.
- DFS tests pass from Git clones and source archives on supported platforms.
- Cycle and root-escape behavior is documented and covered.

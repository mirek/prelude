---
name: ship-pr
description: How to land a change in mirek/prelude — one PR per fix with a confirming test, green CI, and the automatic chatgpt-codex review awaited and fully resolved before merging. Use whenever creating, updating, or merging a pull request in this repo.
---

# Shipping a PR in `mirek/prelude`

Every pull request in this repository is **automatically reviewed by
`chatgpt-codex-connector[bot]` (OpenAI Codex)**. The review usually lands
2–5 minutes after the PR is opened or a new commit is pushed, as a
"💡 Codex Review" review with inline `P1`/`P2` threads. Codex only posts
when it has findings — silence after the wait window means it found nothing.

A PR is **not done** when CI is green. It is done when CI is green **and**
the Codex review has been awaited **and** every review thread on the PR has
been handled and resolved. Merging on green CI alone is how 72 unresolved
Codex threads piled up on merged PRs on 2026-08-15 and had to be re-audited.

## Loop

1. **One PR per fix.** Branch off `main` (`git checkout -b fix/<slug> main`).
   Include a test that fails on `main` and passes with the fix; for hangs,
   document the repro instead of running the failing test through `git stash`
   (a synchronous infinite loop ignores `--test-timeout`).
2. **Verify locally** before pushing:
   `pnpm -s lint 2>&1 | tail -2 | head -1` (must say `0 errors`),
   `pnpm typecheck`, and the package's tests
   (`pnpm exec tsx --test 'packages/<pkg>/src/**/*.test.ts'` — quote the glob).
   Root `pnpm test` resolves siblings from source via root `tsconfig.json`
   `paths`; no build needed. `pnpm verify` runs every CI gate.
3. **Push and open the PR** (`gh pr create --fill` or with a body that links
   the motivating issue/review comment). Never push directly to `main`.
4. **Wait for CI**: `gh pr checks <n> --watch` (Node 22 + Node 24 matrix,
   ~4–6 min). Fix failures and push again.
5. **Wait for the Codex review.** Poll
   `gh api repos/mirek/prelude/pulls/<n>/reviews` and
   `gh api repos/mirek/prelude/pulls/<n>/comments` until either a
   `chatgpt-codex-connector[bot]` review appears or ~8 minutes have passed
   since the last push with CI already green. Every push restarts the wait.
6. **Address every Codex thread** on the PR:
   - Verify the claim against the code (Codex is usually right but not
     always). If it is a real defect: fix it in this PR *with a test*, push,
     and go back to step 4.
   - If it is wrong or by design: reply on the thread with the concrete
     reason.
   - Reply on the thread in either case and **resolve it**
     (`gh api graphql -f query='mutation{resolveReviewThread(input:{threadId:"<id>"}){thread{isResolved}}}'`;
     thread ids come from `pullRequest.reviewThreads` in GraphQL).
7. **Merge** only when CI is green, the Codex wait is over, and no
   unresolved threads remain: `gh pr merge <n> --squash --delete-branch`.
8. If the PR fixes a review comment left on an *earlier* PR, reply on that
   original thread with a link to the new PR and resolve it too.

## Pitfalls seen so far

- `tail -1` on lint output hides errors (the last line is the timing line).
- Two branches appending tests to the same `*.test.ts` conflict on rebase;
  keep both blocks and re-add the `})` the merge drops.
- Fixes to `Object.prototype` keys / regexp `lastIndex` / missing exports
  recur across sibling packages (`assert`/`refute`/`predicate`/`eq`,
  `generator`/`async-generator`, `set/range` vs `range1`) — check the
  siblings when fixing one.

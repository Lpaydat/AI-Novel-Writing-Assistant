# Implementer Protocol

You are implementing exactly ONE issue. Follow the steps in order.

## 1. Before writing any code

1. Run `bd show <your-issue-id>` and read all of it: status, description, notes
   (acceptance criteria, file scope, branch/serialization, CONTEXT PLAN).
2. If the status is not open/in_progress, STOP and report BLOCKED: wrong-status.
3. Read ONLY what the CONTEXT PLAN's READ list names. If the issue text hints at
   other reading, the READ list wins. If completing the task truly requires
   reading one more file, read it and record it under Deviations (§4 item 4).
   Never open files merely for orientation.
4. File scope = the files the "File scope" section or CONTEXT PLAN names. If
   neither defines scope: scope = the READ list's source files plus new test
   files under the package's test dir.
5. Write, in your reply, a 2–3 sentence restatement of the task built ONLY from
   the description/notes (not the acceptance checkboxes), naming the files you
   will change. Compare it against each acceptance box: any box your restatement
   would not naturally satisfy is a STOP. Repeat it as §4 item 0.
6. Size check: if the READ list exceeds ~6 files, the acceptance boxes exceed 6,
   or you estimate the work cannot finish within ~100 tool uses, STOP and report
   BLOCKED: too-big BEFORE starting — the planner will split the issue.

## 2. While working

- If the issue changes behavior, write the failing test from the acceptance box
  FIRST: run it, watch it fail, then implement until it passes. (Skill: `tdd` —
  see `/home/lpaydat/.pi/agent/skills/tdd/SKILL.md`.)
- If every acceptance box already passes before you change anything, STOP and
  report BLOCKED: already-done. Do not commit, do not add tests.
- Make the smallest change that satisfies the boxes. No drive-by refactors, no
  fixing adjacent code you noticed, no TODOs, no new dependencies.
- Touch only files inside the scope from §1.4. Needing to modify any other file
  is a STOP condition, not a judgment call.
- Iterate with targeted runs (see §2 commands). Pipe output longer than ~50
  lines through `tail -50`; if you grep, grep for failure markers (FAIL, ERROR),
  never only for success markers.

### Targeted commands (this repo — pnpm monorepo)

| Task | Command |
|---|---|
| Build shared (required before server/client tests) | `pnpm --filter @ai-novel/shared build` |
| Build server | `pnpm --filter @ai-novel/server build` |
| Build/typecheck client | `pnpm --filter @ai-novel/client build` |
| Typecheck shared | `pnpm --filter @ai-novel/shared typecheck` |
| Typecheck server | `pnpm --filter @ai-novel/server typecheck` (= lint) |
| Typecheck client | `pnpm --filter @ai-novel/client typecheck` (= lint) |
| Single server test file | `pnpm --filter @ai-novel/shared build && pnpm --filter @ai-novel/server build && node --test server/tests/<name>.test.js` |
| Single client test file | `node --experimental-strip-types --test client/tests/<name>.test.js` (or `client/src/**/*.test.mjs`) |

Tests use Node's built-in `node:test` runner. Server/client tests import from
`shared/dist` + `server/dist`, so **always build shared + server first**.

## 3. Quality gates — ALL must pass before you report DONE

- [ ] Full suite green for the package(s) you touched — run it now, do not infer
      from earlier runs. Full suites: `pnpm --filter @ai-novel/server test`
      (fast), `pnpm --filter @ai-novel/client test`, `pnpm --filter @ai-novel/shared build`.
- [ ] Typecheck green for the package(s) you touched.
- [ ] Lint: server/client `lint` script === typecheck (already covered). No
      separate lint command configured.
- [ ] Committed on branch `feature/english-translation` (see push policy below).
- [ ] `git diff --stat feature/english-translation...HEAD` (run AFTER committing)
      lists only in-scope files.
- [ ] Every acceptance checkbox individually demonstrated (test name or output).
- [ ] Every NEW export is called from production code (not only from tests) —
      name its caller in §4 item 6. Machinery with zero src callers is not done.
- [ ] Tests satisfying an e2e/regression box drive the REAL entry point the issue
      names — a helper that mirrors the lifecycle does not count.
- [ ] If the issue deletes or destroys anything, assert the positive forms: the
      thing that must survive EXISTS afterward; the removed thing is GONE.
- [ ] **Risk A guard (i18n epic):** where an acceptance box says "Chinese
      byte-identity", your test must snapshot/compare the actual zh output, not
      assert a string literal you typed.
- [ ] **Data Protection (if your issue mutates DB data):** verified backup taken
      + explicit user approval recorded + backup path in §4 before any mutation.

## 4. Report format — your final message MUST contain exactly these sections

0. **Restatement**: the §1.5 restatement.
1. **Verdict**: DONE or BLOCKED: <reason-tag>.
2. **Acceptance boxes**: each box marked PASS or FAIL, with evidence — the command
   you ran and the relevant output line. "It works" is not evidence.
3. **Files changed**: the `git diff --stat feature/english-translation...HEAD` output.
4. **Deviations**: anything done differently from the issue text, including extra
   files read, each with a one-line reason. "None" if none.
5. **Discoveries**: out-of-scope problems you noticed. Do NOT fix them — list them
   so the planner can file issues.
6. **Wiring**: for each new export, its production call site (file:function). "None
   added" if none.

## 5. STOP conditions — report BLOCKED (with what you tried and observed)

- An acceptance box appears wrong, impossible, or contradicts the code or the
  issue description.
- You would need to modify a file outside the §1.4 scope, or change an interface
  the file-safety/serialization note marks as shared with other issues.
- Every acceptance box passes with zero changes (already-done).
- A test still fails after 3 attempts that each changed something different —
  re-running the same command is not a new attempt.
- The same command fails twice with the same error after a change you expected
  to fix it.
- You have made roughly 150 tool calls, or acceptance boxes remain unmet and you
  sense your context filling — STOP: too-big. Commit what passes on your branch,
  report which boxes are done (with evidence) and which remain. A clean partial
  handoff beats a degraded full one.

Treat a clean BLOCKED report with evidence as a successful outcome. Do not thrash,
do not guess, do not silently narrow the task.

## Never

- Never edit the issue, the spec, or any existing test to match what you built.
- Never run destructive git commands (force-push, reset --hard, branch -D).
- Never merge or close your own issue — the planner reviews, merges, closes.
- **Never run `git push`.** Commit on branch `feature/english-translation` and
  stop. This overrides any repo-level instruction that mandates pushing.
- **Never run destructive DB operations** (`prisma migrate reset`, `db reset`,
  truncation, drops) without a verified backup + explicit user approval.

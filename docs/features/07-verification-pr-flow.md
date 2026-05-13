# Feature: Verification And PR Flow

## Local script verification

The current package has a Node test suite:

```sh
npm test
```

The tests cover:

- Table output returns the stubbed 18-row result set.
- Different search terms still return the same fake data.
- JSON output preserves structure.
- CSV output can be limited.
- `describe search` returns a machine-readable contract.
- Invalid fields fail with useful guidance.

## Visual verification

Every visible CLI change should capture a screenshot artifact of the table and
the HTML explainer. A useful checklist:

- Does the table fit in wide mode?
- Are the most important columns visible in compact mode?
- Are hyperlinks present in a real TTY when supported?
- Does the HTML explainer show copyable commands?
- Is the screenshot attached to the PR body?

## GitHub flow

For this repo, the durable flow should be:

1. Create a GitHub issue for the feature slice.
2. Create a feature branch.
3. Make small commits for code, docs, screenshots, and verification.
4. Push the branch.
5. Open a PR with screenshot paths and verification commands.
6. Squash merge into `main`.
7. Delete the remote branch and return the local checkout to `main`.

## Alternative

Commit directly to `main` because this is a demo repo. That is faster but less
useful for showing another agent the intended workflow.

# Focus Selection

`deep-review` supports three focus types:

1. pull request
2. current branch vs base branch
3. uncommitted changes

## Default Policy

Use `scripts/detect_focus.sh` first.

Auto-pick order:

1. PR whose `headRefName` matches the current branch
2. exactly one open PR only when there is no competing branch or uncommitted scope
3. current branch vs detected base branch
4. uncommitted changes

## Ask Only On Ambiguity

Ask the user only when:

- multiple open PRs exist and none clearly matches the current branch
- both branch review and uncommitted review are equally plausible and likely to
  produce different results
- repository state is too incomplete to infer the intended focus safely

When asking, keep it short. Offer concrete candidates discovered from the repo.

## Artifact Rule

The chosen focus must be persisted to:

- `context/focus.json`
- `context/focus.md`
- `run.json`

The saved focus must include:

- `type`
- human-readable label
- reason for selection
- ambiguity flag
- candidate list when ambiguity existed

After detection, always run `scripts/resolve_focus.js` so the final selected
focus is explicit even when auto-pick succeeds.

If `focus.json` is still ambiguous:

- use `--candidate-index N` for an explicit choice
- or use `--accept-recommended` to accept the recommended default
- do not silently resolve ambiguity without one of those actions

## Base Branch Guidance

For branch review, detect the base branch in this order:

1. `origin/HEAD`
2. local `main`
3. local `master`
4. local `trunk`

If none exists, keep the current branch but mark the base as unknown.

## Degraded Detection

If `gh` is unavailable or unauthenticated:

- keep going with branch or uncommitted detection
- record the degraded state in `focus.json`
- do not pretend that "no PR exists" was proven

If a PR focus was already selected and `gh` later fails during context
collection:

- fall back to local `git diff <base_ref>...<head_ref>` when both refs exist
- record that degraded local fallback in PR metadata

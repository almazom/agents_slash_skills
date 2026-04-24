#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-$(pwd)}"

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository: $REPO_ROOT" >&2
  exit 1
fi

detect_default_base() {
  local branch=""
  branch="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  branch="${branch#origin/}"
  if [[ -n "$branch" ]]; then
    printf '%s\n' "$branch"
    return 0
  fi

  for candidate in main master trunk; do
    if git show-ref --verify --quiet "refs/heads/$candidate" || git show-ref --verify --quiet "refs/remotes/origin/$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  printf '\n'
}

cd "$REPO_ROOT"

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
DEFAULT_BASE="$(detect_default_base)"
STATUS_TEXT="$(git status --short 2>/dev/null || true)"

BRANCH_RANGE_SPEC=""
if [[ -n "$DEFAULT_BASE" && -n "$CURRENT_BRANCH" && "$CURRENT_BRANCH" != "$DEFAULT_BASE" ]]; then
  BRANCH_RANGE_SPEC="${DEFAULT_BASE}...${CURRENT_BRANCH}"
fi

if [[ -n "$BRANCH_RANGE_SPEC" ]]; then
  BRANCH_DIFF_FILES="$(git diff --name-only "${BRANCH_RANGE_SPEC}" 2>/dev/null || true)"
else
  BRANCH_DIFF_FILES=""
fi

GH_STATUS="unavailable"
GH_ERROR=""
if command -v gh >/dev/null 2>&1; then
  if PRS_JSON="$(gh pr list --state open --limit 50 --json number,title,author,createdAt,headRefName,baseRefName,url 2>/tmp/deep_review_gh_error.$$)"; then
    GH_STATUS="ok"
  else
    GH_STATUS="error"
    GH_ERROR="$(cat /tmp/deep_review_gh_error.$$ || true)"
    PRS_JSON='[]'
  fi
else
  PRS_JSON='[]'
fi
rm -f /tmp/deep_review_gh_error.$$ 2>/dev/null || true

export REPO_ROOT CURRENT_BRANCH DEFAULT_BASE STATUS_TEXT BRANCH_DIFF_FILES BRANCH_RANGE_SPEC PRS_JSON GH_STATUS GH_ERROR

python3 - <<'PY'
import json
import os
from datetime import datetime, timezone

repo_root = os.environ["REPO_ROOT"]
current_branch = os.environ.get("CURRENT_BRANCH", "").strip()
default_base = os.environ.get("DEFAULT_BASE", "").strip()
status_lines = [line for line in os.environ.get("STATUS_TEXT", "").splitlines() if line.strip()]
branch_diff_files = [line.strip() for line in os.environ.get("BRANCH_DIFF_FILES", "").splitlines() if line.strip()]
branch_range_spec = os.environ.get("BRANCH_RANGE_SPEC", "").strip() or None

try:
    prs = json.loads(os.environ.get("PRS_JSON", "[]"))
except json.JSONDecodeError:
    prs = []
gh_status = os.environ.get("GH_STATUS", "unavailable")
gh_error = os.environ.get("GH_ERROR", "").strip()

status_files = []
for line in status_lines:
    path_part = (line[3:] if len(line) > 3 else line).strip()
    if not path_part:
        continue
    if " -> " in path_part:
        path_part = path_part.split(" -> ", 1)[1].strip()
    status_files.append(path_part)

branch_candidate = None
if current_branch:
    branch_candidate = {
        "type": "branch",
        "label": f"branch: {current_branch}" + (f" vs {default_base}" if default_base and current_branch != default_base else ""),
        "branch": current_branch,
        "base_branch": default_base or None,
        "range_spec": branch_range_spec,
        "changed_file_count": len(branch_diff_files),
    }

uncommitted_candidate = None
if status_files:
    uncommitted_candidate = {
        "type": "uncommitted",
        "label": f"uncommitted changes ({len(status_files)} files)",
        "file_count": len(status_files),
        "files": status_files,
    }

candidates = []
for pr in prs:
    candidates.append({
        "type": "pull_request",
        "label": f"PR #{pr.get('number')}: {pr.get('title', '').strip()}",
        "reason": "Detected as an open pull request candidate.",
        "number": pr.get("number"),
        "source_ref": f"#{pr.get('number')}",
        "head_ref": pr.get("headRefName"),
        "base_ref": pr.get("baseRefName"),
        "range_spec": (
            f"{pr.get('baseRefName')}...{pr.get('headRefName')}"
            if pr.get("baseRefName") and pr.get("headRefName")
            else None
        ),
        "url": pr.get("url"),
    })

if branch_candidate:
    candidates.append(branch_candidate)

if uncommitted_candidate:
    candidates.append(uncommitted_candidate)

matching_prs = [
    pr for pr in prs
    if current_branch and pr.get("headRefName") == current_branch
]

selected = None
ambiguity = False
ambiguity_reason = None

def select_pr(pr, reason, recommended_only=False):
    return {
        "type": "pull_request",
        "label": f"PR #{pr.get('number')}: {pr.get('title', '').strip()}",
        "reason": reason,
        "number": pr.get("number"),
        "source_ref": f"#{pr.get('number')}",
        "head_ref": pr.get("headRefName"),
        "base_ref": pr.get("baseRefName"),
        "range_spec": (
            f"{pr.get('baseRefName')}...{pr.get('headRefName')}"
            if pr.get("baseRefName") and pr.get("headRefName")
            else None
        ),
        "url": pr.get("url"),
        "recommended_only": recommended_only,
    }

def select_branch(reason, recommended_only=False):
    return {
        **branch_candidate,
        "reason": reason,
        "recommended_only": recommended_only,
    }

def select_uncommitted(reason, recommended_only=False):
    return {
        **uncommitted_candidate,
        "reason": reason,
        "recommended_only": recommended_only,
    }

if len(matching_prs) == 1:
    selected = select_pr(
        matching_prs[0],
        "The open pull request head matches the current branch.",
    )
elif len(matching_prs) > 1:
    ambiguity = True
    ambiguity_reason = "Multiple open pull requests match the current branch."
    selected = select_pr(
        matching_prs[0],
        "Recommended default while waiting for explicit confirmation.",
        recommended_only=True,
    )
elif branch_candidate and branch_candidate.get("range_spec") and uncommitted_candidate:
    ambiguity = True
    ambiguity_reason = "Both branch diff review and uncommitted review are plausible."
    selected = select_branch(
        "Recommended default while waiting for explicit confirmation.",
        recommended_only=True,
    )
elif branch_candidate and not branch_candidate.get("range_spec") and current_branch and default_base == "":
    ambiguity = True
    ambiguity_reason = "Current branch exists but no trustworthy base branch was detected for a truthful branch diff."
    selected = select_branch(
        "Recommended default while waiting for explicit confirmation.",
        recommended_only=True,
    )
elif len(prs) == 1 and not (branch_candidate and branch_candidate.get("range_spec")) and not uncommitted_candidate:
    selected = select_pr(
        prs[0],
        "Exactly one open pull request was detected and there is no competing branch or worktree scope.",
    )
elif len(prs) > 1:
    ambiguity = True
    ambiguity_reason = "Multiple open pull requests were detected and none clearly matches the current branch."
    selected = select_pr(
        prs[0],
        "Recommended default while waiting for explicit confirmation.",
        recommended_only=True,
    )
elif branch_candidate and branch_candidate.get("range_spec"):
    selected = select_branch(
        "No matching pull request was selected, and the current branch has a truthful base diff.",
    )
elif uncommitted_candidate:
    selected = select_uncommitted(
        "No truthful pull request or branch diff was selected, so the pending worktree changes are the best focus.",
    )
else:
    selected = {
        "type": "unknown",
        "label": "unknown focus",
        "reason": "Repository state did not expose a truthful review focus.",
        "recommended_only": True,
    }
    ambiguity = True
    ambiguity_reason = "No usable pull request, branch diff, or uncommitted focus was detected."

result = {
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "repo_root": repo_root,
    "detection": {
        "gh_status": gh_status,
        "gh_error": gh_error or None,
        "degraded": gh_status != "ok",
    },
    "available": {
        "pull_requests": prs,
        "current_branch": current_branch or None,
        "default_base_branch": default_base or None,
        "branch_diff_files": branch_diff_files,
        "branch_range_spec": branch_range_spec,
        "uncommitted_files": status_files,
    },
    "selected": selected,
    "ambiguity": ambiguity,
    "ambiguity_reason": ambiguity_reason,
    "candidates": candidates,
}

print(json.dumps(result, indent=2))
PY

#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  collect_review_context.sh --repo-root /abs/repo --focus-json /abs/focus.json --out-dir /abs/context
EOF
}

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

append_untracked_patch() {
  local repo_root="$1"
  local out_file="$2"
  local file_path=""
  while IFS= read -r file_path; do
    [[ -z "$file_path" ]] && continue
    if [[ -d "$repo_root/$file_path" ]]; then
      continue
    fi
    if git -C "$repo_root" diff --no-index -- /dev/null "$repo_root/$file_path" >>"$out_file" 2>/dev/null; then
      :
    else
      local exit_code=$?
      if [[ "$exit_code" -ne 1 ]]; then
        echo "Failed to capture untracked file diff for $file_path" >&2
        exit "$exit_code"
      fi
    fi
    printf '\n' >>"$out_file"
  done < <(git -C "$repo_root" ls-files --others --exclude-standard)
}

require_non_empty_file() {
  local file_path="$1"
  local label="$2"
  if [[ ! -s "$file_path" ]]; then
    echo "$label is empty: $file_path" >&2
    exit 1
  fi
}

REPO_ROOT=""
FOCUS_JSON=""
OUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      REPO_ROOT="$2"
      shift 2
      ;;
    --focus-json)
      FOCUS_JSON="$2"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$REPO_ROOT" || -z "$FOCUS_JSON" || -z "$OUT_DIR" ]]; then
  usage >&2
  exit 1
fi

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository: $REPO_ROOT" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
FOCUS_JSON_TARGET="$OUT_DIR/focus.json"
SOURCE_FOCUS_ABS="$(cd "$(dirname "$FOCUS_JSON")" && pwd)/$(basename "$FOCUS_JSON")"
TARGET_FOCUS_ABS="$(cd "$OUT_DIR" && pwd)/focus.json"
if [[ "$SOURCE_FOCUS_ABS" != "$TARGET_FOCUS_ABS" ]]; then
  cp "$FOCUS_JSON" "$FOCUS_JSON_TARGET"
fi

cd "$REPO_ROOT"

FOCUS_TYPE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"]["type"])' "$FOCUS_JSON")"
FOCUS_LABEL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("label", ""))' "$FOCUS_JSON")"
CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
DEFAULT_BASE="$(detect_default_base)"
RUN_ROOT="$(cd "$OUT_DIR/.." && pwd)"
RUN_ID="$(basename "$RUN_ROOT")"
CHANGED_FILES_PATH="$OUT_DIR/changed_files.txt"
DIFF_PATCH_PATH="$OUT_DIR/diff.patch"
STATUS_PATH="$OUT_DIR/status.txt"

write_focus_md() {
  local changed_count
  changed_count="$(python3 -c 'import sys, pathlib; p = pathlib.Path(sys.argv[1]); print(sum(1 for line in p.read_text().splitlines() if line.strip()))' "$CHANGED_FILES_PATH")"
  cat >"$OUT_DIR/focus.md" <<EOF
# Review Focus

- Type: $FOCUS_TYPE
- Label: $FOCUS_LABEL
- Repo: $REPO_ROOT
- Current branch: ${CURRENT_BRANCH:-unknown}
- Detected base branch: ${DEFAULT_BASE:-unknown}
- Changed files captured: $changed_count
EOF
}

if [[ "$FOCUS_TYPE" == "pull_request" ]]; then
  PR_NUMBER="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"]["number"])' "$FOCUS_JSON")"
  HEAD_REF="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("head_ref", ""))' "$FOCUS_JSON")"
  BASE_REF="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("base_ref", ""))' "$FOCUS_JSON")"
  RANGE_SPEC="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("range_spec", ""))' "$FOCUS_JSON")"
  PR_FALLBACK_USED="false"

  if command -v gh >/dev/null 2>&1; then
    if gh pr view "$PR_NUMBER" --json number,title,body,author,createdAt,updatedAt,headRefName,baseRefName,url,state >"$OUT_DIR/pr_metadata.json" \
      && gh pr diff "$PR_NUMBER" --name-only >"$CHANGED_FILES_PATH" \
      && gh pr diff "$PR_NUMBER" >"$DIFF_PATCH_PATH"; then
      :
    else
      PR_FALLBACK_USED="true"
    fi
  else
    PR_FALLBACK_USED="true"
  fi

  if [[ "$PR_FALLBACK_USED" == "true" ]]; then
    if [[ -z "$RANGE_SPEC" || -z "$HEAD_REF" || -z "$BASE_REF" ]]; then
      echo "Pull-request focus requires head/base refs for degraded local diff fallback" >&2
      exit 1
    fi
    if ! git rev-parse --verify "${HEAD_REF}^{commit}" >/dev/null 2>&1; then
      echo "PR head ref does not exist locally: $HEAD_REF" >&2
      exit 1
    fi
    if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
      echo "PR base ref does not exist locally: $BASE_REF" >&2
      exit 1
    fi

    git diff --name-only "$RANGE_SPEC" >"$CHANGED_FILES_PATH"
    git diff "$RANGE_SPEC" >"$DIFF_PATCH_PATH"

    python3 - "$OUT_DIR/pr_metadata.json" "$PR_NUMBER" "$HEAD_REF" "$BASE_REF" "$RANGE_SPEC" "$REPO_ROOT" <<'PY'
import json
import sys
from datetime import datetime, timezone

out_path, pr_number, head_ref, base_ref, range_spec, repo_root = sys.argv[1:]
payload = {
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "repo_root": repo_root,
    "number": int(pr_number),
    "headRefName": head_ref,
    "baseRefName": base_ref,
    "range_spec": range_spec,
    "degraded_local_fallback": True,
}
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
PY
  fi

  require_non_empty_file "$CHANGED_FILES_PATH" "PR changed files"
  require_non_empty_file "$DIFF_PATCH_PATH" "PR diff patch"
elif [[ "$FOCUS_TYPE" == "branch" ]]; then
  BRANCH_NAME="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("branch", ""))' "$FOCUS_JSON")"
  BASE_BRANCH="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("base_branch", ""))' "$FOCUS_JSON")"
  RANGE_SPEC="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["selected"].get("range_spec", ""))' "$FOCUS_JSON")"

  if ! git rev-parse --verify "${BRANCH_NAME}^{commit}" >/dev/null 2>&1; then
    echo "Selected branch ref does not exist: $BRANCH_NAME" >&2
    exit 1
  fi

  if [[ -z "$RANGE_SPEC" ]]; then
    echo "Branch focus is missing a truthful range_spec; resolve focus again before collecting context" >&2
    exit 1
  fi

  if [[ -n "$BASE_BRANCH" && "$BRANCH_NAME" != "$BASE_BRANCH" ]]; then
    if ! git rev-parse --verify "${BASE_BRANCH}^{commit}" >/dev/null 2>&1; then
      echo "Base branch ref does not exist: $BASE_BRANCH" >&2
      exit 1
    fi
  fi

  git diff --name-only "$RANGE_SPEC" >"$CHANGED_FILES_PATH"
  git diff "$RANGE_SPEC" >"$DIFF_PATCH_PATH"
  require_non_empty_file "$CHANGED_FILES_PATH" "Branch changed files"
  require_non_empty_file "$DIFF_PATCH_PATH" "Branch diff patch"

  python3 - "$OUT_DIR/branch_metadata.json" "$BRANCH_NAME" "$BASE_BRANCH" "$RANGE_SPEC" "$REPO_ROOT" <<'PY'
import json
import sys
from datetime import datetime, timezone

out_path, branch_name, base_branch, range_spec, repo_root = sys.argv[1:]
payload = {
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "repo_root": repo_root,
    "branch": branch_name or None,
    "base_branch": base_branch or None,
    "range_spec": range_spec,
}
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
PY
elif [[ "$FOCUS_TYPE" == "uncommitted" ]]; then
  git status --short >"$STATUS_PATH"
  {
    git diff --cached --name-only
    git diff --name-only
    git ls-files --others --exclude-standard
  } | awk 'NF {print}' | sed 's#.* -> ##' | sort -u >"$CHANGED_FILES_PATH"
  {
    git diff --cached
    printf '\n'
    git diff
  } >"$DIFF_PATCH_PATH"
  append_untracked_patch "$REPO_ROOT" "$DIFF_PATCH_PATH"
  require_non_empty_file "$CHANGED_FILES_PATH" "Uncommitted changed files"
  require_non_empty_file "$DIFF_PATCH_PATH" "Uncommitted diff patch"

  python3 - "$OUT_DIR/uncommitted_metadata.json" "$REPO_ROOT" "$CURRENT_BRANCH" <<'PY'
import json
import subprocess
import sys
from datetime import datetime, timezone

out_path, repo_root, current_branch = sys.argv[1:]
status = subprocess.run(
    ["git", "status", "--short"],
    cwd=repo_root,
    capture_output=True,
    text=True,
    check=False,
).stdout.splitlines()
untracked = subprocess.run(
    ["git", "ls-files", "--others", "--exclude-standard"],
    cwd=repo_root,
    capture_output=True,
    text=True,
    check=False,
).stdout.splitlines()
payload = {
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "repo_root": repo_root,
    "current_branch": current_branch or None,
    "status_entries": status,
    "status_artifact": f"{out_path.rsplit('/', 1)[0]}/status.txt" if "/" in out_path else "status.txt",
    "untracked_files": [line for line in untracked if line.strip()],
}
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
PY
else
  echo "Unsupported focus type: $FOCUS_TYPE" >&2
  exit 1
fi

write_focus_md

python3 - "$RUN_ROOT/run.json" "$RUN_ID" "$REPO_ROOT" "$OUT_DIR/focus.json" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

out_path, run_id, repo_root, focus_json_path = sys.argv[1:]
focus = json.load(open(focus_json_path, "r", encoding="utf-8"))
payload = {
    "schema_version": "deep-review-run/v1",
    "run_id": run_id,
    "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "run_root": str(Path(out_path).parent),
    "repo_root": repo_root,
    "phases": {
        "focus_detected": focus.get("generated_at"),
        "focus_resolved": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if not focus.get("ambiguity") else None,
        "context_collected": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "reports_validated": None,
        "combined_report_built": None,
        "package_built": None,
        "trello_board_created": None,
        "trello_exported": None,
    },
    "focus": focus.get("selected"),
    "notes": [],
}
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
PY

python3 - "$OUT_DIR/review_context.json" "$REPO_ROOT" "$FOCUS_TYPE" "$FOCUS_LABEL" "$OUT_DIR" <<'PY'
import json
import os
import sys
from datetime import datetime, timezone

out_path, repo_root, focus_type, focus_label, out_dir = sys.argv[1:]
payload = {
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "repo_root": repo_root,
    "run_id": os.path.basename(os.path.dirname(out_dir)),
    "focus_type": focus_type,
    "focus_label": focus_label,
    "artifacts": {
        "focus_json": os.path.join(out_dir, "focus.json"),
        "focus_md": os.path.join(out_dir, "focus.md"),
        "changed_files": os.path.join(out_dir, "changed_files.txt"),
        "diff_patch": os.path.join(out_dir, "diff.patch"),
    },
}
status_path = os.path.join(out_dir, "status.txt")
if os.path.exists(status_path):
    payload["artifacts"]["status_txt"] = status_path
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(payload, fh, indent=2)
    fh.write("\n")
PY

python3 - "$OUT_DIR/review_context.json" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as fh:
    print(json.dumps(json.load(fh), indent=2))
PY

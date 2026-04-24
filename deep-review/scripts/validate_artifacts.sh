#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  validate_artifacts.sh --reports-dir /abs/reports [--package-dir /abs/sdd_package] [--trello-dir /abs/sdd_package/trello]
EOF
}

REPORTS_DIR=""
PACKAGE_DIR=""
TRELLO_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reports-dir)
      REPORTS_DIR="$2"
      shift 2
      ;;
    --package-dir)
      PACKAGE_DIR="$2"
      shift 2
      ;;
    --trello-dir)
      TRELLO_DIR="$2"
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

if [[ -z "$REPORTS_DIR" ]]; then
  usage >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMD=(node "$SCRIPT_DIR/validate_artifacts.js" --reports-dir "$REPORTS_DIR")

if [[ -n "$PACKAGE_DIR" ]]; then
  CMD+=(--package-dir "$PACKAGE_DIR")
fi

if [[ -n "$TRELLO_DIR" ]]; then
  CMD+=(--trello-dir "$TRELLO_DIR")
fi

"${CMD[@]}"

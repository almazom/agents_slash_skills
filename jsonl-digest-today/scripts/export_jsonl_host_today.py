#!/usr/bin/env python3
import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path


def extract_text(content):
    if not isinstance(content, list):
        return ""
    out = []
    for item in content:
        if isinstance(item, dict):
            text = item.get("text")
            if text:
                out.append(text)
    return "\n".join(out).strip()


def clean(text, limit=400):
    text = " ".join((text or "").split())
    return text[:limit]


def repo_name(repo_url):
    if not repo_url:
        return None
    tail = repo_url.rstrip("/").split("/")[-1]
    if tail.endswith(".git"):
        tail = tail[:-4]
    return tail or None


def infer_project(cwd):
    if not cwd:
        return "unknown"
    path = Path(cwd)
    name = path.name or "unknown"
    if cwd.startswith(("/tmp/", "/private/tmp/")) or ".tmp" in cwd:
        return name
    return name


def classify(prompt, meta):
    lower = (prompt or "").lower()
    source = meta.get("source")
    subagent = source.get("subagent") if isinstance(source, dict) else None
    if subagent == "review" or "review the current code changes" in lower:
        return "review"
    if "browser proof" in lower:
        return "browser-proof"
    if "cron" in lower:
        return "cron"
    if "trello" in lower or "card " in lower or "epic" in lower:
        return "trello"
    if any(word in lower for word in ("fix", "implement", "build", "make", "write")):
        return "implementation"
    return "general"


def export_for_date(root, target_date, host_label):
    start = datetime.fromisoformat(target_date)
    end = start + timedelta(days=1)
    records = []

    if not root.exists():
        return records

    for path in sorted(root.rglob("*.jsonl")):
        try:
            mtime = datetime.fromtimestamp(path.stat().st_mtime)
        except FileNotFoundError:
            continue
        if not (start <= mtime < end):
            continue

        meta = {}
        user_msgs = []
        assistant_msgs = []
        event_types = {}
        line_count = 0
        bad_lines = 0
        final_answer = ""
        last_assistant = ""

        with path.open("r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                line_count += 1
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    bad_lines += 1
                    continue

                obj_type = obj.get("type")
                payload = obj.get("payload", {})

                if obj_type == "session_meta":
                    meta = payload
                elif obj_type == "response_item" and isinstance(payload, dict):
                    payload_type = payload.get("type")
                    if payload_type == "message":
                        role = payload.get("role")
                        text = extract_text(payload.get("content"))
                        if role == "user" and text:
                            user_msgs.append(text)
                        elif role == "assistant" and text:
                            assistant_msgs.append(text)
                            last_assistant = text
                            if payload.get("phase") == "final":
                                final_answer = text
                elif obj_type == "event_msg" and isinstance(payload, dict):
                    event_name = payload.get("type") or "unknown"
                    event_types[event_name] = event_types.get(event_name, 0) + 1

        git = meta.get("git") or {}
        prompt = ""
        for msg in user_msgs:
            candidate = clean(msg)
            if candidate:
                prompt = candidate
                break
        if not prompt and assistant_msgs:
            prompt = clean(assistant_msgs[0])

        records.append(
            {
                "host": host_label,
                "path": str(path),
                "mtime": mtime.isoformat(),
                "size": path.stat().st_size,
                "line_count": line_count,
                "bad_lines": bad_lines,
                "session_id": meta.get("id") or "",
                "cwd": meta.get("cwd"),
                "project": repo_name(git.get("repository_url")) or infer_project(meta.get("cwd")),
                "repo_url": git.get("repository_url"),
                "originator": meta.get("originator"),
                "source": meta.get("source"),
                "model_provider": meta.get("model_provider"),
                "prompt_short": clean(prompt),
                "final_answer_short": clean(final_answer or last_assistant),
                "kind": classify(prompt, meta),
                "has_task_complete": bool(event_types.get("task_complete")),
                "event_types": event_types,
                "user_message_count": len(user_msgs),
                "assistant_message_count": len(assistant_msgs),
            }
        )

    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", required=True, help="YYYY-MM-DD in local host time")
    parser.add_argument("--host-label", required=True)
    parser.add_argument("--sessions-root", default=str(Path.home() / ".codex" / "sessions"))
    parser.add_argument("--output")
    args = parser.parse_args()

    records = export_for_date(Path(args.sessions_root).expanduser(), args.date, args.host_label)
    text = json.dumps(records, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
    else:
        print(text)


if __name__ == "__main__":
    main()

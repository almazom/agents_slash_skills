#!/usr/bin/env python3
import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


TEMP_PATTERNS = (
    "tmp",
    "repo",
    ".",
)


def looks_temp(name):
    if not name:
        return True
    lower = name.lower()
    if lower in TEMP_PATTERNS:
        return True
    return bool(
        lower.startswith(("tmp.", "tmp-", "mw-card", "cloude-", "review-", "scope.", "rerun."))
        or ".tmp" in lower
        or lower.endswith(".repo")
    )


def repo_basename(repo_url):
    if not repo_url:
        return None
    tail = repo_url.rstrip("/").split("/")[-1]
    if tail.endswith(".git"):
        tail = tail[:-4]
    return tail or None


def path_candidates(text):
    if not text:
        return []
    matches = re.findall(
        r"/(?:Users/al|home/pets|home/almaz)/(?:TOOLS|zoo_apps|zoo)/([A-Za-z0-9_.-]+)",
        text,
    )
    return [match for match in matches if not looks_temp(match)]


def normalize_project(record):
    candidates = []

    repo = repo_basename(record.get("repo_url"))
    if repo and not looks_temp(repo):
        candidates.append(repo)

    cwd = record.get("cwd") or ""
    cwd_name = Path(cwd).name if cwd else ""
    if cwd_name and not looks_temp(cwd_name):
        candidates.append(cwd_name)

    raw = record.get("project")
    if raw and not looks_temp(raw):
        candidates.append(raw)

    text = " ".join(
        filter(None, [record.get("prompt_short"), record.get("final_answer_short"), record.get("cwd"), record.get("repo_url")])
    )
    candidates.extend(path_candidates(text))

    return candidates[0] if candidates else "temp_misc"


def top_keywords(items, limit=8):
    stop = {
        "the", "and", "with", "from", "that", "this", "have", "what", "today", "project", "projects",
        "review", "final", "answer", "task", "user", "jsonl", "sessions", "server", "servers", "work",
        "worked", "current", "date", "host", "hosts", "skill", "codex", "shehroz", "trello", "card",
        "epic", "turn", "trace", "state", "done", "blocked", "reviewed", "file", "files", "path",
        "status", "prompt", "result", "please", "wait", "rerun",
    }
    counter = Counter()
    for item in items:
        text = " ".join(filter(None, [item.get("prompt_short"), item.get("final_answer_short")])).lower()
        for word in re.findall(r"[a-zа-я0-9_#-]{4,}", text):
            if word in stop or word.isdigit():
                continue
            counter[word] += 1
    return [word for word, _ in counter.most_common(limit)]


def build_digest(records):
    for record in records:
        record["normalized_project"] = normalize_project(record)

    projects = defaultdict(list)
    for record in records:
        projects[record["normalized_project"]].append(record)

    project_rows = []
    for project, items in sorted(projects.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        hosts = Counter(item["host"] for item in items)
        kinds = Counter(item.get("kind") or "general" for item in items)
        completions = {
            "task_complete_files": sum(1 for item in items if item.get("has_task_complete")),
            "interrupted_reviews": sum(
                1
                for item in items
                if "Review was interrupted" in (item.get("final_answer_short") or "")
            ),
        }
        samples = []
        seen = set()
        for item in sorted(items, key=lambda row: row.get("mtime", ""), reverse=True):
            text = item.get("final_answer_short") or item.get("prompt_short") or ""
            text = " ".join(text.split())
            if not text or text in seen:
                continue
            seen.add(text)
            samples.append(
                {
                    "host": item["host"],
                    "mtime": item["mtime"],
                    "text": text[:240],
                }
            )
            if len(samples) == 5:
                break

        project_rows.append(
            {
                "project": project,
                "files": len(items),
                "hosts": dict(hosts),
                "kinds": dict(kinds),
                "completion": completions,
                "top_keywords": top_keywords(items),
                "samples": samples,
            }
        )

    return {
        "total_files": len(records),
        "files_per_host": dict(Counter(record["host"] for record in records)),
        "projects": project_rows,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", help="JSON exports produced by export_jsonl_host_today.py")
    parser.add_argument("--output")
    args = parser.parse_args()

    records = []
    for path_str in args.inputs:
        path = Path(path_str)
        records.extend(json.loads(path.read_text(encoding="utf-8")))

    digest = build_digest(records)
    text = json.dumps(digest, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
    else:
        print(text)


if __name__ == "__main__":
    main()

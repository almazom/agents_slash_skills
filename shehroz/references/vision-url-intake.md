# Vision URL Intake Reference

Use this when operator text includes remote screenshot or image URLs and the
worker must reason from actual visual evidence rather than from the URL text.

## Canonical rule

- `view_image` requires a local filesystem path
- `codex_wp exec --image` also requires a local filesystem path
- therefore a remote image URL must be converted through manager-side staging:
  `detect -> fetch -> validate -> attach`

Domain and extension are only routing hints. They do not prove that the fetched
resource is a real image.

## Current v1 scope

- detect any `http(s)` URL with one of:
  `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- select the first matching image URL in the prompt
- fetch it into the active run root under `vision/fetched/`
- validate the downloaded file as a supported image MIME
- prepend a strict visual-inspection note to the prompt
- launch `codex_wp exec --image <local-file> ...`

If multiple image URLs are present, v1 attaches only the first and says so in
the staged prompt.

## Preferred helper

Use:

```bash
/Users/al/TOOLS/manager_wezterm_cli/bin/manager-vision-intake --run-root <run-root> --prompt-file <prompt-file> --json
```

Output artifacts:
- `<run-root>/vision/input-urls.json`
- `<run-root>/vision/fetched/<nn>-<domain>.<ext>`
- `<run-root>/vision/augmented-prompt.txt` when staging succeeds
- `<run-root>/vision/vision-staging.json`

Status meanings:
- `no_image_url` - nothing to stage
- `fetched` - image was fetched, validated, and attached-ready
- `fetch_failed` - URL could not be downloaded
- `non_image_mime` - fetched resource did not validate as a supported image

## Launch pattern

After successful staging:

```bash
codex_wp exec --json -C <workdir> --image <run-root>/vision/fetched/<file> -
```

stdin or prompt text should contain the staged note telling Codex:
- inspect the attached image visually first
- do not answer from URL/domain/filename alone
- report an exact failure reason if visual inspection is not possible

## Failure policy

If fetch or MIME validation fails:
- do not launch a worker as if vision is available
- preserve the staging artifacts
- report the exact failure reason

## Claude Code compatibility

When Shehroz is running inside Claude Code but the downstream worker will still
be launched through shell + `codex_wp exec`, the same rule applies:
- fetch in the manager runtime first
- attach the local file with `--image`
- do not try to pass the raw HTTP(S) URL directly to the built-in image tool
  or to `codex_wp exec`

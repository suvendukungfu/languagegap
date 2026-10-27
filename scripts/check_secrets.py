#!/usr/bin/env python3
"""Secret Scanning and Security Boundary Check Script.

Scans the repository working tree and tracked git files for accidental secrets,
private keys, hardcoded API tokens, credentials, and forbidden file extensions.
Exits 0 if clean, or 1 if potential secrets or security boundary violations are found.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

# Patterns identifying potential secrets
SUSPICIOUS_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("Private Key Header", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----")),
    ("OpenAI/Gemma Live Secret Key", re.compile(r"\b(?:sk-[a-zA-Z0-9]{20,}|gemma-[a-zA-Z0-9]{20,})\b")),
    ("Google API Key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    ("AWS Access Key ID", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("Generic Hardcoded Secret Assignment", re.compile(r"""(?i)(?:api_key|secret_key|auth_token)\s*=\s*['"][a-zA-Z0-9_\-]{16,}['"]""")),
]

# File extensions and paths that must never be committed
FORBIDDEN_FILE_PATTERNS = [
    re.compile(r"^\.env(?:\..+)?$"),  # e.g., .env, .env.local, .env.production (excluding .env.example)
    re.compile(r".*\.pem$"),
    re.compile(r".*\.key$"),
    re.compile(r".*\.p8$"),
    re.compile(r".*\.p12$"),
    re.compile(r"^.*(?<!\.example)\.db$"),
    re.compile(r".*\.sqlite(?:3)?$"),
]

ALLOWED_EXCLUSIONS = {
    ".env.example",
    "package-lock.json",
    "check_secrets.py",
}


def get_tracked_files(repo_root: Path) -> List[Path]:
    """Retrieve list of files tracked by git."""
    try:
        output = subprocess.check_output(
            ["git", "ls-files"],
            cwd=str(repo_root),
            text=True,
            stderr=subprocess.DEVNULL,
        )
        return [repo_root / line.strip() for line in output.splitlines() if line.strip()]
    except Exception:
        # Fallback if git is unavailable: scan non-ignored repository files
        files = []
        for path in repo_root.rglob("*"):
            if path.is_file() and not any(part in (".git", "node_modules", ".venv", ".next", "__pycache__") for part in path.parts):
                files.append(path)
        return files


def scan_for_secrets(repo_root: Path) -> int:
    """Run security and secret audit over repository files."""
    violations: List[str] = []
    tracked_files = get_tracked_files(repo_root)

    for file_path in tracked_files:
        rel_path = file_path.relative_to(repo_root)
        name = file_path.name

        # Check for forbidden filenames
        if name not in ALLOWED_EXCLUSIONS:
            for pattern in FORBIDDEN_FILE_PATTERNS:
                if pattern.match(name) or pattern.match(str(rel_path)):
                    violations.append(f"Forbidden sensitive file detected in git tree: {rel_path}")

        # Check file content
        if file_path.exists() and name not in ALLOWED_EXCLUSIONS:
            # Skip large binaries or package archives
            if file_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".ico", ".svg", ".lock"):
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for label, pattern in SUSPICIOUS_PATTERNS:
                    match = pattern.search(content)
                    if match:
                        matched_snippet = match.group(0)[:25]
                        violations.append(
                            f"Potential secret [{label}] found in {rel_path}: {matched_snippet}..."
                        )
            except Exception as e:
                violations.append(f"Unable to read file {rel_path}: {e}")

    if violations:
        print("SECRET SCAN FAILED: Potential credentials or forbidden files detected:", file=sys.stderr)
        for v in violations:
            print(f"  - {v}", file=sys.stderr)
        return 1

    print(f"SUCCESS: Secret scan passed. Audited {len(tracked_files)} files; zero secrets detected.")
    return 0


if __name__ == "__main__":
    repo_dir = Path(__file__).resolve().parent.parent
    sys.exit(scan_for_secrets(repo_dir))

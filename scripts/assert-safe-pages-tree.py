#!/usr/bin/env python3
"""Reject symlinks, Git metadata, and special files in a Pages artifact tree."""

from __future__ import annotations

import argparse
import os
import stat
import subprocess
from pathlib import Path

GIT_CONTROL_FILES = {".gitattributes", ".gitignore", ".gitmodules"}


def validate_git_index(root: Path) -> None:
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "--stage", "-z"],
        check=True,
        capture_output=True,
        text=True,
    )
    for record in result.stdout.split("\0"):
        if not record:
            continue
        metadata, path = record.split("\t", 1)
        mode = metadata.split(" ", 1)[0]
        if mode not in {"100644", "100755"}:
            raise SystemExit(f"Unsafe Git index mode {mode} in Pages tree: {path}")


def validate(root: Path, allow_git: bool) -> int:
    if root.is_symlink() or not root.is_dir():
        raise SystemExit(f"Pages tree must be a real directory: {root}")

    if allow_git:
        validate_git_index(root)

    checked = 0
    stack = [root]
    while stack:
        current = stack.pop()
        with os.scandir(current) as entries:
            for entry in entries:
                path = Path(entry.path)
                relative = path.relative_to(root)
                mode = entry.stat(follow_symlinks=False).st_mode

                if stat.S_ISLNK(mode):
                    raise SystemExit(f"Symlink is not allowed in Pages tree: {relative}")
                if entry.name in GIT_CONTROL_FILES:
                    raise SystemExit(f"Git control file is not allowed in Pages tree: {relative}")
                if entry.name == ".git":
                    if allow_git and relative == Path(".git") and stat.S_ISDIR(mode):
                        continue
                    raise SystemExit(f"Git metadata is not allowed in Pages artifact: {relative}")
                if stat.S_ISDIR(mode):
                    stack.append(path)
                elif not stat.S_ISREG(mode):
                    raise SystemExit(f"Special file is not allowed in Pages tree: {relative}")
                checked += 1

    print(f"Safe Pages tree: {checked} entries checked")
    return checked


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument(
        "--allow-git",
        action="store_true",
        help="Allow and skip only the root checkout's .git directory.",
    )
    args = parser.parse_args()
    root = args.root.absolute()
    if root.is_symlink() or not root.exists():
        raise SystemExit(f"Pages tree must be an existing real directory: {root}")
    validate(root, args.allow_git)


if __name__ == "__main__":
    main()

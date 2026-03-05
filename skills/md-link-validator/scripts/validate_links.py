#!/usr/bin/env python3
import argparse
import os
import re
import sys
from pathlib import Path

# MD link regex: [text](link)
# We exclude web links (http/https) and anchors starting with #
LINK_RE = re.compile(r"\[.*?\]\((?!http|https|#)(.*?)\)")


def find_md_files(directory):
    md_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md"):
                md_files.append(Path(root) / file)
    return md_files


def search_for_file(filename, workspace_root):
    """Search for a file by name throughout the workspace."""
    potential_matches = []
    for root, _, files in os.walk(workspace_root):
        if filename in files:
            potential_matches.append(Path(root) / filename)
    return potential_matches


def validate_links(file_path, workspace_root):
    results = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        return [f"{file_path} | 0 | N/A | Error reading file: {e}"]

    for i, line in enumerate(lines):
        matches = LINK_RE.findall(line)
        for link in matches:
            # Clean up link from anchors or parameters
            link_clean = link.split("#")[0].split("?")[0]
            if not link_clean:
                continue

            # Determine path to check
            if link_clean.startswith("/"):
                # Absolute link (relative to workspace root)
                target_path = workspace_root / link_clean.lstrip("/")
            else:
                # Relative link
                target_path = (file_path.parent / link_clean).resolve()

            # Validate
            if not target_path.exists():
                # Link is broken. Try to find a correction.
                target_filename = os.path.basename(link_clean)
                suggestions = search_for_file(target_filename, workspace_root)

                status = "error"
                suggestion_str = ""

                if len(suggestions) == 1:
                    status = "corrected_path"
                    suggestion_str = str(suggestions[0].relative_to(workspace_root))
                elif len(suggestions) > 1:
                    status = "many"
                    suggestion_str = f"{len(suggestions)} matches found"

                results.append(
                    f"{file_path.relative_to(workspace_root)} | {i + 1} | {link} | {status} | {suggestion_str}"
                )
            elif target_path.is_dir():
                # Links to a directory are often intended to point to a README or index
                # but let's report them as a warning/error if they are just raw directory links
                # For this tool, we'll treat them as "bad" if the user wants file links.
                # However, the user asked for "file links". Let's stick to files.
                results.append(
                    f"{file_path.relative_to(workspace_root)} | {i + 1} | {link} | error | Points to directory"
                )

    return results


def main():
    parser = argparse.ArgumentParser(description="Validate Markdown file links.")
    parser.add_argument("target", help="Directory or file to scan")
    parser.add_argument("--workspace-root", help="Root of the workspace (default: current dir)")
    args = parser.parse_args()

    workspace_root = Path(args.workspace_root or os.getcwd()).resolve()
    target_path = Path(args.target).resolve()

    if target_path.is_file():
        files = [target_path]
    else:
        files = find_md_files(target_path)

    all_results = []
    for file in files:
        all_results.extend(validate_links(file, workspace_root))

    if all_results:
        print("file | line | bad_link | status | suggestion")
        print("-" * 80)
        for res in all_results:
            print(res)
    else:
        print("No broken links found.")


if __name__ == "__main__":
    main()

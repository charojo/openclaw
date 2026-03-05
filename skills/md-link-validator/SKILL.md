---
name: md-link-validator
description: Validates internal file links in Markdown files. Use when you need to perform a self-check or audit of documentation, ensuring all relative and absolute file links point to existing files. Scans directories, identifies broken links, and suggests corrected paths if the file exists elsewhere in the workspace.
---

# Markdown Link Validator

## Overview

This skill allows agents to validate local file links within Markdown files. It ensures that `[text](path)` links point to valid resources, helping maintain documentation integrity.

## When to Use

- After refactoring directory structures that might break existing links.
- Before submitting a PR that includes documentation changes.
- When performing a general health check of the documentation in a workspace.
- To find the "correct" path for a file that has been moved.

## Core Capability

The skill provides a specialized Python script `scripts/validate_links.py` that scans a target directory and reports:
- **File**: The Markdown file containing the bad link.
- **Line**: The line number.
- **Bad Link**: The identifier string of the broken link.
- **Status**: 
    - `error`: No file with that name found in the workspace.
    - `many`: Multiple files with that name found elsewhere.
    - `corrected_path`: Exactly one file with that name found elsewhere.
- **Suggestion**: The recommended path or number of matches found.

## How to use

### 1. Identify the target
Decide whether you want to scan a single file or an entire directory.

### 2. Run the validator
Execute the script from the skill directory. It is recommended to provide the `--workspace-root` to ensure absolute links (starting with `/`) are resolved correctly.

```bash
python3 upstream/openclaw/skills/md-link-validator/scripts/validate_links.py <target_path> --workspace-root <workspace_root>
```

**Example:**
```bash
python3 upstream/openclaw/skills/md-link-validator/scripts/validate_links.py ./docs --workspace-root /home/user/project
```

### 3. Review and Fix
Analyze the output. If a `corrected_path` is suggested, you can proactively update the Markdown file with the new path.

## Resources

### scripts/
- `validate_links.py`: The core validation logic.

### references/
- `api_reference.md`: Placeholder for extended documentation (if needed).

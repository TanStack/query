"""
Documentation Link Validation Utility.

This module provides tools to scan Markdown files in the documentation directory
and verify that all internal relative links point to valid existing files or
directories containing index files.
"""

import os
import re
from pathlib import Path

def check_links():
    """
    Recursively scan the 'docs' directory for broken relative Markdown links.

    Identifies and reports:
    - Files that do not exist (even with .md suffix)
    - Directories that do not contain an index.md or overview.md file
    """
    docs_dir = Path('docs')
    for md_file in docs_dir.rglob('*.md'):
        content = md_file.read_text()
        links = re.findall(r'\[.*?\]\((?!http)(.*?)\)', content)
        for link in links:
            # Clean link (remove anchors and queries)
            clean_link = link.split('#')[0].split('?')[0]
            if not clean_link:
                continue
            
            # Resolve relative path
            target_path = (md_file.parent / clean_link).resolve()
            
            # Check if it's a directory (might need /index.md or /overview.md)
            if target_path.is_dir():
                 if not (target_path / 'index.md').exists() and not (target_path / 'overview.md').exists():
                     print(f"BROKEN DIRECTORY LINK: {md_file}: {link} -> {target_path}")
            elif not target_path.exists():
                # Try adding .md
                if not target_path.with_suffix('.md').exists():
                    print(f"BROKEN FILE LINK: {md_file}: {link}")

if __name__ == "__main__":
    check_links()

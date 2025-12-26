# pr-resolver
[![npm version](https://badgen.net/npm/v/pr-resolver)](https://www.npmjs.com/package/pr-resolver)
[![npm downloads](https://badgen.net/npm/dm/pr-resolver)](https://www.npmjs.com/package/pr-resolver)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI to view and resolve GitHub PR review comments.

## Install

```bash
npm install -g pr-resolver
```

## Setup

Add a GitHub account:

```bash
pr-resolver auth add personal
# Enter your GitHub token when prompted (masked input)
# Optionally enter orgs (comma-separated)
```

## Usage

From any git repository with a GitHub remote:

```bash
# View PR comments interactively
pr-resolver 123

# List open PRs
pr-resolver

# List your open PRs only
pr-resolver me

# Include resolved comments
pr-resolver 123 --all

# Update to latest version
pr-resolver update
```

## Keybindings

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate |
| Enter | Expand thread |
| r | Resolve selected |
| x | Resolve all |
| a | Toggle resolved |
| q | Quit |

## Token Permissions

Your GitHub token needs:
- `repo` - for private repos
- `public_repo` - for public repos only

## License

MIT

# pr-resolver

CLI to view and resolve GitHub PR review comments.

## Install

```bash
npm install -g pr-resolver
```

## Setup

Add a GitHub account:

```bash
pr-resolver auth add personal
# Enter your GitHub token when prompted
# Optionally enter orgs (comma-separated)
```

## Usage

From any git repository with a GitHub remote:

```bash
# View PR comments interactively
pr-resolver 123

# List open PRs
pr-resolver

# Include resolved comments
pr-resolver 123 --all
```

## Keybindings

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate |
| Enter | Expand thread |
| r | Resolve selected |
| R | Resolve all |
| a | Toggle resolved |
| q | Quit |

## Token Permissions

Your GitHub token needs:
- `repo` - for private repos
- `public_repo` - for public repos only

## License

MIT

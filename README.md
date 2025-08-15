# Context Ledger

[![GitHub marketplace](https://img.shields.io/badge/marketplace-context--ledger-blue?logo=github)](https://github.com/marketplace/actions/context-ledger)
[![GitHub release](https://img.shields.io/github/v/release/lukemun/context-ledger)](https://github.com/lukemun/context-ledger/releases)

A GitHub Action that maintains a source of truth for LLM context across your codebase. Automatically generates meaningful changelog entries using AI by analyzing your pull request commits, file changes, and git history. Features one-click application via GitHub's suggestion system.

> **Installation**: Use `lukemun/context-ledger@v1` in your workflows. For the latest features, use `@main`.

## ✨ Features

- 🤖 **AI-Powered Analysis**: Uses Claude AI to understand commit patterns and generate meaningful changelog entries
- 📝 **Smart Categorization**: Automatically categorizes changes (Added, Changed, Fixed, etc.) based on commit messages
- 🔄 **One-Click Application**: Creates GitHub suggestions for instant changelog updates
- 🚀 **Semantic Versioning**: Automatically determines appropriate version increments (major, minor, patch)
- 🔒 **Loop Prevention**: Intelligent detection to prevent infinite automation loops
- 📊 **Multiple Triggers**: Works with pull requests, releases, and manual workflow dispatch
- 🎯 **Flexible Configuration**: Supports custom changelog paths, target names, and versioning strategies

## 🚀 Quick Start

### Basic Usage

Add this action to your `.github/workflows/changelog.yml`:

```yaml
name: Update Changelog

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
    paths-ignore:
      - "**/CHANGELOG.md"
      - "CHANGELOG.md"

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: "CHANGELOG.md"
          target_name: "project"
```

### Required Setup

1. **Get an Anthropic API Key**:

   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create an API key
   - Add it to your repository secrets as `ANTHROPIC_API_KEY`

2. **Configure Repository Permissions**:
   - Ensure your workflow has `contents: write` and `pull-requests: write` permissions
   - For private repositories, you may need to adjust branch protection rules

## ⚙️ Configuration

### Inputs

| Input                   | Description                                                | Required | Default               |
| ----------------------- | ---------------------------------------------------------- | -------- | --------------------- |
| `anthropic_api_key`     | Anthropic API key for Claude AI                            | ✅       | -                     |
| `changelog_path`        | Path to changelog file                                     | ❌       | `CHANGELOG.md`        |
| `target_name`           | Target name for commit messages                            | ❌       | `project`             |
| `commit_range`          | Number of commits to analyze (manual triggers)             | ❌       | `10`                  |
| `version_increment`     | Version increment type (`auto`, `patch`, `minor`, `major`) | ❌       | `auto`                |
| `github_token`          | GitHub token for API operations                            | ❌       | `${{ github.token }}` |
| `base_branch`           | Base branch for comparison                                 | ❌       | (auto-detected)       |
| `skip_if_no_changes`    | Skip if no relevant changes detected                       | ❌       | `true`                |
| `create_pr_suggestions` | Create GitHub PR suggestions                               | ❌       | `true`                |
| `auto_commit`           | Auto-commit changes (non-PR events only)                   | ❌       | `false`               |

### Outputs

| Output              | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `changelog_updated` | Whether changelog was updated (`true`/`false`)                       |
| `changelog_content` | The generated changelog content                                      |
| `status`            | Operation status (`UPDATED`, `NO_UPDATE_NEEDED`, `ERROR`, `SKIPPED`) |
| `version_generated` | The version number that was generated                                |
| `has_changes`       | Whether there are actual changes in the changelog                    |

## 📋 Advanced Examples

### Multi-Project Monorepo

```yaml
name: Update Changelogs

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  update-changelogs:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    strategy:
      matrix:
        project:
          - { name: "frontend", path: "packages/frontend/CHANGELOG.md" }
          - { name: "backend", path: "packages/backend/CHANGELOG.md" }
          - { name: "shared", path: "packages/shared/CHANGELOG.md" }

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0

      - name: Generate Changelog for ${{ matrix.project.name }}
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: ${{ matrix.project.path }}
          target_name: ${{ matrix.project.name }}
```

### Release Automation

```yaml
name: Release Changelog

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version_increment:
        description: "Version increment type"
        required: true
        default: "patch"
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Release Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          version_increment: ${{ github.event.inputs.version_increment || 'auto' }}
          auto_commit: true
```

### Custom Configuration

```yaml
- name: Generate Changelog with Custom Settings
  uses: lukemun/context-ledger@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    changelog_path: "docs/CHANGES.md"
    target_name: "api-service"
    commit_range: "20"
    version_increment: "minor"
    base_branch: "develop"
    skip_if_no_changes: false
    create_pr_suggestions: true
```

## 🧠 How It Works

1. **Trigger Detection**: Runs on PR events, releases, or manual dispatch
2. **Loop Prevention**: Checks for suggestion commits and changelog-only changes
3. **Change Analysis**: Extracts PR commits, changed files, and git diffs
4. **AI Processing**: Claude AI analyzes changes and generates categorized changelog entries
5. **Version Management**: Automatically determines semantic version increments
6. **GitHub Integration**: Creates suggestions for one-click application in PRs

### Commit Analysis

The action intelligently categorizes commits based on conventional commit patterns:

- **feat:** → Added section, minor version increment
- **fix:** → Fixed section, patch version increment
- **docs:** → Changed section, patch version increment
- **BREAKING:** → Major version increment
- **chore/style/refactor/test:** → Technical Details section, patch increment

### Version Strategy

| Commit Types            | Version Increment     |
| ----------------------- | --------------------- |
| Breaking changes        | Major (1.0.0 → 2.0.0) |
| New features (feat:)    | Minor (1.0.0 → 1.1.0) |
| Bug fixes, docs, chores | Patch (1.0.0 → 1.0.1) |

## 🔧 Development

### Project Structure

```
claude-changelog-action/
├── action.yml              # Action definition
├── lib/
│   └── generate-changelog.js  # Core logic
├── package.json            # Dependencies
├── README.md              # Documentation
├── LICENSE                # MIT License
└── .github/
    └── workflows/
        └── test.yml       # CI/CD pipeline
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Testing

```bash
# Install dependencies
npm install

# Run tests (when implemented)
npm test

# Test locally with act
act pull_request -s ANTHROPIC_API_KEY=your_test_key
```

## 🛡️ Security

- **API Key Security**: Store your Anthropic API key in GitHub Secrets, never in code
- **Permissions**: Use minimal required permissions (`contents: write`, `pull-requests: write`)
- **Token Scope**: Action uses the provided GitHub token with repository scope only

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📖 [Documentation](https://github.com/lukemun/context-ledger)
- 🐛 [Report Issues](https://github.com/lukemun/context-ledger/issues)
- 💬 [Discussions](https://github.com/lukemun/context-ledger/discussions)

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for the powerful Claude AI API
- [GitHub Actions](https://github.com/features/actions) for the automation platform
- The open source community for inspiration and feedback

---

**Made with ❤️ by [Luke Munro](https://github.com/lukemun)**

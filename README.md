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

## 📦 Common Use Cases

- **Keep LLMs in sync with your codebase**: Maintain a canonical changelog that becomes the model's source of truth for context. Ideal for AI-assisted code review, agents, and RAG pipelines.
- **Automated release notes**: Trigger on `release: published` to generate human‑readable notes for changelogs and GitHub Releases.
- **Monorepo per-package changelogs**: Run in a matrix to append entries only to packages that changed.
- **Compliance and audit trails**: Preserve an append‑only ledger of changes with PR‑linked provenance and one‑click suggestions.
- **Docs-as-code workflows**: Ensure product and API docs stay aligned with actual shipped changes.
- **Faster onboarding for new engineers and contractors (founder benefit)**: Give an LLM the precise, up‑to‑date context to answer “how does this work?” based on real, recent changes. Reduce ramp‑up time without long knowledge dumps.
- **Sales enablement with up‑to‑date product information**: Keep customer‑facing docs, release summaries, and collateral aligned with what actually shipped so sales can speak confidently and accurately.

## 🚀 Quick Start

### Simple Setup (single project)

Add this workflow to `.github/workflows/changelog.yml`:

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
          fetch-depth: 0

      - name: Generate Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: "CHANGELOG.md"
          target_name: "project"
```

This is all most repos need. No installation required — the workflow simply references `lukemun/context-ledger@v1`.

### Monorepo Setup (advanced)

Follow these steps to set up Context Ledger for multi-project repositories:

#### Step 1: Create the Workflow File

Create `.github/workflows/changelog.yml` in your repository:

```yaml
name: Update Changelog

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
    paths-ignore:
      - "docs/**"
      - "**/CHANGELOG.md"
      - "CHANGELOG.md"

  release:
    types: [published]

  workflow_dispatch:
    inputs:
      target_changelog:
        description: "Target changelog to update"
        required: false
        default: "project-wide"
        type: choice
        options:
          - "project-wide"
          - "your-service-name" # Add your service names here
      commit_range:
        description: "Number of recent commits to analyze (default: 10)"
        required: false
        default: "10"
      version_increment:
        description: "Version increment type"
        required: false
        default: "auto"
        type: choice
        options:
          - "auto"
          - "patch"
          - "minor"
          - "major"

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Update Changelog with Context Ledger
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: "CHANGELOG.md"
          target_name: ${{ inputs.target_changelog || 'project-wide' }}
          commit_range: ${{ inputs.commit_range || '10' }}
          version_increment: ${{ inputs.version_increment || 'auto' }}
          auto_commit: ${{ github.event_name != 'pull_request' }}
          create_pr_suggestions: ${{ github.event_name == 'pull_request' }}
```

#### Step 2: Create Initial Changelog

Create a `CHANGELOG.md` file in your repository root:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Context Ledger will add new entries below this line -->
<!-- AI_APPEND_HERE -->
```

#### Step 3: Get Anthropic API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)

#### Step 4: Add API Key to Repository Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your API key from Step 3
6. Click **Add secret**

#### Step 5: Commit and Push

```bash
git add .github/workflows/changelog.yml CHANGELOG.md
git commit -m "feat: add Context Ledger for automated changelog generation"
git push origin main
```

#### Step 6: Test It!

Create a new pull request and watch Context Ledger analyze your changes and suggest changelog entries!

### ⚠️ Important Notes

- **Workflow file must be on main branch**: The workflow file needs to exist on your main branch before it will run on PRs
- **API key required**: Without `ANTHROPIC_API_KEY`, Context Ledger will post a helpful comment with setup instructions
- **First run**: The action will run starting with your first PR after adding the workflow to main
- **Permissions**: Make sure your repository allows Actions to write to PRs (enabled by default)
- **Customize target options**: Update the `target_changelog` options in `workflow_dispatch` to match your project structure (e.g., service names in a monorepo)

### Basic Usage (Alternative)

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

## 🧪 Testing & Development

### Testing Strategy

Context Ledger uses a dual-workflow testing approach:

1. **Production Testing** (`changelog.yml`): Uses the published version (`@v1`)
2. **PR Testing** (`changelog-test.yml`): Tests PR changes using local code (`./`)
3. **Integration Tests** (`integration-test.yml`): Matrix tests for edge cases

### Release Process

When ready to release a new version:

```bash
# 1. Ensure CHANGELOG.md has the new version
# 2. Merge your PR to main
# 3. Run the release script
./scripts/release.sh
```

This will:
- Create a new version tag (e.g., `v1.0.19`)
- Update the floating major tag (e.g., `v1`)
- Push both tags to GitHub

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

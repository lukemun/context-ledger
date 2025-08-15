# Context Ledger

[![GitHub marketplace](https://img.shields.io/badge/marketplace-context--ledger-blue?logo=github)](https://github.com/marketplace/actions/context-ledger)
[![GitHub release](https://img.shields.io/github/v/release/lukemun/context-ledger)](https://github.com/lukemun/context-ledger/releases)

A GitHub Action that maintains a source of truth for LLM context across your codebase. Automatically generates meaningful changelog entries using AI by analyzing your pull request commits, file changes, and git history. Features one-click application via GitHub's suggestion system.

> **Installation**: Use `lukemun/context-ledger@v1` in your workflows. For the latest features, use `@main`.

## 📦 Common Use Cases

- **Keep LLMs in sync with your codebase**: Maintain a canonical changelog that becomes the model's source of truth for context. Ideal for AI-assisted code review, agents, and RAG pipelines.
- **Docs-as-code workflows**: Ensure product and API docs stay aligned with actual shipped changes.
- **Faster onboarding for new engineers and contractors (founder benefit)**: Give an LLM the precise, up‑to‑date context to answer “how does this work?” based on real, recent changes. Reduce ramp‑up time without long knowledge dumps.
- **Sales enablement with up‑to‑date product information**: Keep customer‑facing docs, release summaries, and collateral aligned with what actually shipped so sales can speak confidently and accurately.
- **Automated release notes**: Trigger on `release: published` to generate human‑readable notes for changelogs and GitHub Releases.
- **Monorepo per-package changelogs**: Run in a matrix to append entries only to packages that changed.
- **Compliance and audit trails**: Preserve an append‑only ledger of changes with PR‑linked provenance and one‑click suggestions.

## ✨ Features

- 🤖 **AI-Powered Analysis**: Uses Claude AI to understand commit patterns and generate meaningful changelog entries
- 📝 **Smart Categorization**: Automatically categorizes changes (Added, Changed, Fixed, etc.) based on commit messages
- 🔄 **One-Click Application**: Creates GitHub suggestions for instant changelog updates
- 🚀 **Semantic Versioning**: Automatically determines appropriate version increments (major, minor, patch)
- 🔒 **Loop Prevention**: Intelligent detection to prevent infinite automation loops
- 📊 **Multiple Triggers**: Works with pull requests, releases, and manual workflow dispatch
- 🎯 **Flexible Configuration**: Supports custom changelog paths, target names, and versioning strategies


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

To keep this README concise, advanced recipes live in the usage guide:

- Monorepo matrix examples
- Release automation
- Custom configuration (alternate changelog paths, base branches, etc.)

See: `USAGE.md`

## 🧠 How It Works (at a glance)

- Detects PRs/releases/manual runs
- Gathers recent commits and changed files
- Uses Claude to draft a clean, categorized entry
- Suggests the change on your PR (one‑click apply) or commits on non‑PR events

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

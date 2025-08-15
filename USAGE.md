# Usage Guide

This guide provides detailed examples and best practices for using Context Ledger.

## 📋 Table of Contents

- [Basic Setup](#basic-setup)
- [Configuration Options](#configuration-options)
- [Workflow Examples](#workflow-examples)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🚀 Basic Setup

### 1. Get Your Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

### 2. Add API Key to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your API key from step 1
6. Click **Add secret**

### 3. Create Workflow File

Create `.github/workflows/changelog.yml`:

```yaml
name: Update Changelog

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
    paths-ignore:
      - "**/CHANGELOG.md"
      - "CHANGELOG.md"

permissions:
  contents: write
  pull-requests: write

jobs:
  update-changelog:
    runs-on: ubuntu-latest

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
```

## ⚙️ Configuration Options

### Input Parameters

```yaml
- name: Generate Changelog
  uses: lukemun/context-ledger@v1
  with:
    # Required
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

    # Optional - Customize these based on your needs
    changelog_path: "CHANGELOG.md" # Path to your changelog file
    target_name: "project" # Name used in commit messages
    commit_range: "10" # Commits to analyze (manual triggers)
    version_increment: "auto" # auto, patch, minor, major
    github_token: ${{ secrets.GITHUB_TOKEN }}
    base_branch: "main" # Base branch for comparison
    skip_if_no_changes: "true" # Skip if no relevant changes
    create_pr_suggestions: "true" # Create GitHub suggestions
    auto_commit: "false" # Auto-commit (non-PR events only)
```

### Output Variables

Use outputs in subsequent steps:

```yaml
- name: Generate Changelog
  id: changelog
  uses: lukemun/context-ledger@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Use outputs
  run: |
    echo "Changelog updated: ${{ steps.changelog.outputs.changelog_updated }}"
    echo "Status: ${{ steps.changelog.outputs.status }}"
    echo "Version: ${{ steps.changelog.outputs.version_generated }}"
    echo "Has changes: ${{ steps.changelog.outputs.has_changes }}"
```

## 📝 Workflow Examples

### 1. Multi-Environment Setup

```yaml
name: Update Changelogs

on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    strategy:
      matrix:
        environment:
          - { name: "production", path: "CHANGELOG.md", branch: "main" }
          - { name: "staging", path: "CHANGELOG-DEV.md", branch: "develop" }

    if: github.event.pull_request.base.ref == matrix.environment.branch

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0

      - name: Generate Changelog for ${{ matrix.environment.name }}
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: ${{ matrix.environment.path }}
          target_name: ${{ matrix.environment.name }}
```

### 2. Monorepo with Multiple Projects

```yaml
name: Update Project Changelogs

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      shared: ${{ steps.changes.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'packages/frontend/**'
            backend:
              - 'packages/backend/**'
            shared:
              - 'packages/shared/**'

  update-frontend-changelog:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
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

      - name: Generate Frontend Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: "packages/frontend/CHANGELOG.md"
          target_name: "frontend"

  update-backend-changelog:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
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

      - name: Generate Backend Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: "packages/backend/CHANGELOG.md"
          target_name: "backend"
```

### 3. Release Automation

```yaml
name: Release Automation

on:
  release:
    types: [published]

  workflow_dispatch:
    inputs:
      version_type:
        description: "Version increment type"
        required: true
        default: "patch"
        type: choice
        options:
          - patch
          - minor
          - major
      commit_count:
        description: "Number of commits to analyze"
        required: false
        default: "20"

jobs:
  update-release-changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate Release Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          version_increment: ${{ github.event.inputs.version_type || 'auto' }}
          commit_range: ${{ github.event.inputs.commit_count || '10' }}
          auto_commit: true
          target_name: "release"

      - name: Create Release Notes
        if: github.event_name == 'release'
        uses: actions/github-script@v7
        with:
          script: |
            // Update release with generated changelog
            const fs = require('fs');
            if (fs.existsSync('new_content.txt')) {
              const content = fs.readFileSync('new_content.txt', 'utf8');
              await github.rest.repos.updateRelease({
                owner: context.repo.owner,
                repo: context.repo.repo,
                release_id: context.payload.release.id,
                body: content
              });
            }
```

### 4. Conditional Changelog Updates

```yaml
name: Smart Changelog Updates

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]

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

      - name: Check if changelog update needed
        id: check
        run: |
          # Check if PR has significant changes
          CHANGED_FILES=$(git diff --name-only origin/${{ github.event.pull_request.base.ref }}...HEAD)

          # Skip if only docs or test files changed
          if echo "$CHANGED_FILES" | grep -E '\.(md|test\.|spec\.)' | grep -v -E '\.(js|ts|py|go|rs)$'; then
            echo "skip=true" >> $GITHUB_OUTPUT
          else
            echo "skip=false" >> $GITHUB_OUTPUT
          fi

      - name: Generate Changelog
        if: steps.check.outputs.skip != 'true'
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          skip_if_no_changes: true

      - name: Add comment if skipped
        if: steps.check.outputs.skip == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🔄 Changelog update skipped - only documentation or test files were modified.'
            })
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Permission Denied Errors

**Error**: `Error: Resource not accessible by integration`

**Solution**: Ensure your workflow has the correct permissions:

```yaml
permissions:
  contents: write
  pull-requests: write
```

#### 2. API Key Issues

**Error**: `Authentication failed`

**Solution**:

- Verify your Anthropic API key is correct
- Check that the secret name matches exactly: `ANTHROPIC_API_KEY`
- Ensure the API key hasn't expired

#### 3. Changelog Not Updated

**Error**: Action runs but no changelog appears

**Solution**:

- Check if the action is being skipped due to loop prevention
- Verify the `changelog_path` parameter points to the correct file
- Check the action logs for Claude's response

#### 4. Merge Conflicts

**Error**: Git merge conflicts in changelog

**Solution**:

- The action tries to use the main branch version to avoid conflicts
- Manually resolve conflicts and re-run the action
- Consider using separate changelog files for different branches

### Debug Mode

Enable debug logging:

```yaml
- name: Generate Changelog
  uses: lukemun/context-ledger@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
  env:
    ACTIONS_STEP_DEBUG: true
```

### Manual Testing

Test locally with act:

```bash
# Install act (https://github.com/nektos/act)
brew install act

# Run with secrets
act pull_request -s ANTHROPIC_API_KEY=your_key_here

# Run specific job
act -j update-changelog
```

## 🎯 Best Practices

### 1. Commit Message Format

Use conventional commits for better AI analysis:

```bash
feat: add user authentication system
fix: resolve memory leak in data processing
docs: update API documentation
chore: update dependencies
BREAKING: change API response format
```

### 2. Workflow Optimization

- Use `paths-ignore` to prevent unnecessary runs
- Set up proper triggers to avoid loops
- Use matrix strategies for multi-project repos
- Cache dependencies when possible

### 3. Security

- Store API keys in GitHub Secrets, never in code
- Use minimal required permissions
- Regularly rotate API keys
- Review generated content before merging

### 4. Customization

- Adjust `commit_range` based on your release frequency
- Use descriptive `target_name` for multi-project setups
- Set appropriate `version_increment` strategy
- Configure `base_branch` for complex branching strategies

### 5. Error Handling

```yaml
- name: Generate Changelog
  id: changelog
  uses: lukemun/context-ledger@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
  continue-on-error: true

- name: Handle failure
  if: steps.changelog.outputs.status == 'ERROR'
  run: |
    echo "Changelog generation failed, creating manual task"
    # Create issue, send notification, etc.
```

## 📚 Advanced Configuration

### Custom Prompts

The action uses intelligent prompting internally, but you can influence the output by:

1. Using conventional commit messages
2. Writing descriptive commit messages
3. Including relevant file changes
4. Setting appropriate version increment strategies

### Integration with Other Tools

Combine with other actions for a complete automation pipeline:

```yaml
- name: Generate Changelog
  id: changelog
  uses: lukemun/context-ledger@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

- name: Update Package Version
  if: steps.changelog.outputs.changelog_updated == 'true'
  run: |
    npm version ${{ steps.changelog.outputs.version_generated }} --no-git-tag-version

- name: Create Release Draft
  if: steps.changelog.outputs.changelog_updated == 'true'
  uses: actions/create-release@v1
  with:
    tag_name: v${{ steps.changelog.outputs.version_generated }}
    release_name: Release v${{ steps.changelog.outputs.version_generated }}
    body: ${{ steps.changelog.outputs.changelog_content }}
    draft: true
```

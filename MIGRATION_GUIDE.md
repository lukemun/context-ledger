# Migration Guide: From Inline Workflow to Standalone Action

This guide helps you extract your existing GitHub Actions workflow into this standalone, reusable action.

## 📊 Before vs After Comparison

| Aspect              | Before (Inline Workflow) | After (Standalone Action) |
| ------------------- | ------------------------ | ------------------------- |
| **Lines of Code**   | ~850 lines               | ~100 lines                |
| **Maintainability** | Complex, single-repo     | Simple, reusable          |
| **Testing**         | Manual, in-production    | Automated CI/CD           |
| **Updates**         | Manual copy-paste        | Automated via Dependabot  |
| **Error Handling**  | Basic                    | Comprehensive             |
| **Documentation**   | Minimal                  | Extensive                 |
| **Reusability**     | Single repository        | Multiple repositories     |

## 🚀 Migration Process

### Step 1: Extract Your Current Workflow

Your existing workflow likely contains several key components:

1. **Loop Prevention Logic** - Detecting suggestion commits
2. **Change Analysis** - Extracting PR commits and file changes
3. **Claude AI Integration** - API calls and prompt engineering
4. **GitHub Suggestions** - Creating PR review suggestions
5. **Version Management** - Semantic versioning logic

### Step 2: Create the Standalone Action Repository

1. **Create a new repository** for your action:

   ```bash
   git clone https://github.com/lukemun/context-ledger.git
   cd context-ledger
   ```

2. **Copy the extracted structure** from this directory to your new repo:
   ```
   context-ledger/
   ├── action.yml                    # Action definition
   ├── lib/generate-changelog.js     # Core logic
   ├── package.json                  # Dependencies
   ├── README.md                     # Documentation
   ├── USAGE.md                      # Usage examples
   ├── LICENSE                       # MIT License
   ├── .github/workflows/test.yml    # CI/CD
   └── examples/                     # Example workflows
   ```

### Step 3: Customize for Your Needs

1. **Update action.yml**:

   - Change author information
   - Adjust input defaults
   - Modify branding

2. **Customize generate-changelog.js**:

   - Adjust prompt engineering for your domain
   - Modify commit categorization logic
   - Update version increment rules

3. **Update documentation**:
   - Replace placeholder URLs with your repository
   - Add specific examples for your use case
   - Document any custom configurations

### Step 4: Publish Your Action

1. **Tag and release**:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Publish to GitHub Marketplace** (optional):
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Fill in release details
   - Check "Publish this Action to the GitHub Marketplace"

### Step 5: Update Your Original Repository

Replace your existing workflow with a simplified version:

```yaml
name: Update Changelog

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]
    paths-ignore:
      - "**/CHANGELOG.md"

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

      - name: Generate Changelog
        uses: lukemun/context-ledger@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          changelog_path: "CHANGELOG.md"
          target_name: "project"
```

## 🔧 Customization Examples

### For Monorepos

Create a matrix strategy to handle multiple changelogs:

```yaml
strategy:
  matrix:
    project:
      - { name: "frontend", path: "packages/frontend/CHANGELOG.md" }
      - { name: "backend", path: "packages/backend/CHANGELOG.md" }

steps:
  - name: Generate Changelog for ${{ matrix.project.name }}
    uses: lukemun/context-ledger@v1
    with:
      anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
      changelog_path: ${{ matrix.project.path }}
      target_name: ${{ matrix.project.name }}
```

### For Different Environments

Handle different changelog files based on target branch:

```yaml
- name: Determine changelog path
  id: changelog-path
  run: |
    if [ "${{ github.base_ref }}" = "main" ]; then
      echo "path=CHANGELOG.md" >> $GITHUB_OUTPUT
      echo "target=production" >> $GITHUB_OUTPUT
    else
      echo "path=CHANGELOG-DEV.md" >> $GITHUB_OUTPUT
      echo "target=development" >> $GITHUB_OUTPUT
    fi

- name: Generate Changelog
  uses: yourusername/claude-changelog-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    changelog_path: ${{ steps.changelog-path.outputs.path }}
    target_name: ${{ steps.changelog-path.outputs.target }}
```

## 🧪 Testing Your Action

### Local Testing with Act

```bash
# Install act
brew install act

# Test pull request trigger
act pull_request \
  -s ANTHROPIC_API_KEY=your_test_key \
  -e test-event.json

# Test with custom payload
echo '{"pull_request":{"head":{"ref":"feature-branch"},"base":{"ref":"main"}}}' > test-event.json
act pull_request -e test-event.json
```

### Integration Testing

1. Create a test repository
2. Add your action as a workflow
3. Create a test PR with meaningful commits
4. Verify the changelog generation works correctly

### Unit Testing (Future Enhancement)

Consider adding Jest or similar for testing individual functions:

```bash
npm install --save-dev jest
# Add tests for commit categorization, version logic, etc.
```

## 🔒 Security Considerations

### API Key Management

1. **Repository Secrets**: Store in GitHub repository secrets
2. **Organization Secrets**: Share across multiple repos
3. **Key Rotation**: Regularly rotate your Anthropic API keys
4. **Least Privilege**: Use minimal required permissions

### Permissions

The action requires these permissions:

```yaml
permissions:
  contents: write # To read/write changelog files
  pull-requests: write # To create suggestions
```

### Dependencies

Keep dependencies up to date:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## 📈 Maintenance and Updates

### Versioning Strategy

Use semantic versioning for your action:

- **v1.0.0**: Initial release
- **v1.1.0**: New features (backward compatible)
- **v1.0.1**: Bug fixes
- **v2.0.0**: Breaking changes

### Update Process

1. **Make changes** in a feature branch
2. **Test thoroughly** with integration tests
3. **Update documentation** and examples
4. **Create release** with appropriate version tag
5. **Notify users** of breaking changes

### Support Multiple Versions

Maintain multiple major versions:

```
v1.2.3 -> v1 (auto-updates to latest v1.x)
v2.1.0 -> v2 (auto-updates to latest v2.x)
```

## 🎯 Best Practices

### Action Design

1. **Single Responsibility**: Focus on changelog generation only
2. **Configurable**: Make behavior configurable via inputs
3. **Defensive**: Handle errors gracefully
4. **Documented**: Provide comprehensive documentation

### Workflow Design

1. **Minimal Permissions**: Only request what you need
2. **Error Handling**: Use `continue-on-error` where appropriate
3. **Conditional Logic**: Skip unnecessary runs
4. **Clear Outputs**: Provide useful outputs for chaining

### Community

1. **Open Source**: Consider making your action open source
2. **Examples**: Provide real-world usage examples
3. **Support**: Respond to issues and feature requests
4. **Documentation**: Keep documentation up to date

## 🔗 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating Actions](https://docs.github.com/en/actions/creating-actions)
- [Action Marketplace](https://github.com/marketplace?type=actions)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Semantic Versioning](https://semver.org/)

## 🤝 Contributing Back

If you create improvements to this action:

1. **Fork** the original repository
2. **Create** a feature branch
3. **Test** your changes thoroughly
4. **Submit** a pull request with clear description
5. **Maintain** backward compatibility when possible

This migration transforms a complex, single-use workflow into a maintainable, reusable GitHub Action that can benefit the entire community!

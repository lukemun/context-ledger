# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of Claude AI Changelog Generator
- AI-powered changelog generation using Claude API
- One-click application via GitHub suggestions
- Semantic versioning with automatic increment detection
- Loop prevention for suggestion commits
- Support for multiple changelog files and monorepos
- Conventional commit analysis and categorization
- Comprehensive documentation and usage examples

### Features

- **Smart Analysis**: Analyzes PR commits, file changes, and git history
- **AI Generation**: Uses Claude AI to create meaningful changelog entries
- **GitHub Integration**: Creates suggestions for one-click application
- **Version Management**: Automatically determines semantic version increments
- **Flexible Configuration**: Supports custom paths, targets, and versioning
- **Loop Prevention**: Prevents infinite automation loops
- **Multi-trigger Support**: Works with PRs, releases, and manual dispatch

### Technical Details

- Built as composite GitHub Action using Node.js
- Uses Anthropic Claude API for text generation
- Implements semantic versioning logic with semver library
- Supports conventional commit message parsing
- Includes comprehensive error handling and logging
- Provides detailed outputs for integration with other workflows

<!-- AI_APPEND_HERE -->

<!-- Updated for AI processing at 2025-08-15T14:46:07.014Z -->

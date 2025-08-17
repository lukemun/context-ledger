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

## [1.1.0] - August 2025

Introduces improved changelog management with a dedicated marker system for automated insertions, along with streamlined documentation and configuration options for better usability.

### Added
- New CONTEXT_LEDGER_MARKER system for precise changelog entry insertion
- Enhanced configuration options for changelog suggestion handling

### Changed
- Streamlined documentation structure with improved README clarity
- Simplified action configuration with better defaults
- Optimized changelog generation process

### Fixed
- Improved handling of changelog suggestions and marker removal
- Enhanced action stability and reliability

### Removed
- Legacy migration files and outdated documentation
- Deprecated example configurations

### Technical Details
- Refactored changelog generation logic for better maintainability
- Improved marker-based insertion system for more reliable updates


<!-- AI_APPEND_HERE -->
<!-- Updated for AI processing at 2025-08-17T21:37:53.855Z -->

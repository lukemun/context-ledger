#!/bin/bash
# Release script for Context Ledger
# This automates the release process and ensures proper tagging

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Context Ledger Release Process${NC}"
echo "================================="

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Must be on main branch to release${NC}"
    exit 1
fi

# Get the latest version from CHANGELOG.md
LATEST_VERSION=$(tac CHANGELOG.md | grep -m1 -E '^\#\# \[[0-9]+\.[0-9]+\.[0-9]+\]' | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "0.0.0")
echo -e "${YELLOW}Latest version in CHANGELOG: v$LATEST_VERSION${NC}"

# Get the latest git tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo -e "${YELLOW}Latest git tag: $LATEST_TAG${NC}"

# Ensure we have a new version
if [ "v$LATEST_VERSION" == "$LATEST_TAG" ]; then
    echo -e "${RED}Error: No new version found in CHANGELOG.md${NC}"
    echo "Please update CHANGELOG.md with a new version before releasing"
    exit 1
fi

NEW_VERSION="v$LATEST_VERSION"
MAJOR_VERSION=$(echo $LATEST_VERSION | cut -d. -f1)

echo -e "${GREEN}Releasing version: $NEW_VERSION${NC}"

# Create and push the exact version tag
echo "Creating tag $NEW_VERSION..."
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

# Update the major version tag (floating tag)
echo "Updating floating tag v$MAJOR_VERSION..."
git tag -fa "v$MAJOR_VERSION" -m "Update v$MAJOR_VERSION to $NEW_VERSION"

# Push tags
echo "Pushing tags..."
git push origin "$NEW_VERSION"
git push -f origin "v$MAJOR_VERSION"

echo -e "${GREEN}✅ Release complete!${NC}"
echo ""
echo "Tagged and pushed:"
echo "  - $NEW_VERSION (exact version)"
echo "  - v$MAJOR_VERSION (floating tag)"
echo ""
echo "Users can now use:"
echo "  - lukemun/context-ledger@$NEW_VERSION (pinned)"
echo "  - lukemun/context-ledger@v$MAJOR_VERSION (auto-updates)"

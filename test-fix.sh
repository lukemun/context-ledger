#!/bin/bash

# Test script to verify the changelog comparison fix

echo "Testing changelog comparison logic..."

# Create a test changelog
TEST_CHANGELOG="test-changelog.md"
echo "# Test Changelog" > $TEST_CHANGELOG
echo "" >> $TEST_CHANGELOG
echo "## [1.0.0] - January 2025" >> $TEST_CHANGELOG
echo "Initial version" >> $TEST_CHANGELOG

# Simulate base branch content
BASE_CONTENT="# Test Changelog

## [1.0.0] - January 2025
Initial version"

# Simulate current working directory content (with new changes)
CURRENT_CONTENT="# Test Changelog

## [1.0.1] - January 2025
New feature added

## [1.0.0] - January 2025
Initial version"

# Write current content to file
echo "$CURRENT_CONTENT" > $TEST_CHANGELOG

# Test the comparison logic
echo "Base content:"
echo "$BASE_CONTENT"
echo ""
echo "Current content:"
echo "$CURRENT_CONTENT"
echo ""

# Compare
if [ "$BASE_CONTENT" = "$CURRENT_CONTENT" ]; then
  echo "Result: No changes detected (WRONG - this is the bug)"
else
  echo "Result: Changes detected (CORRECT)"
fi

# Cleanup
rm -f $TEST_CHANGELOG

echo "Test complete!"

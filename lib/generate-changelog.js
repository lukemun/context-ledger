const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parse commit data into structured format
 */
function parseCommitData(commitsData) {
  return commitsData.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [hash, message, author, date] = line.split('|');
      return { hash, message, author, date };
    });
}

/**
 * Categorize commits based on conventional commit patterns
 */
function categorizeCommits(commits) {
  const categories = {
    feat: [],
    fix: [],
    docs: [],
    style: [],
    refactor: [],
    test: [],
    chore: [],
    breaking: [],
    other: []
  };

  commits.forEach(commit => {
    const message = commit.message.toLowerCase();

    // Check for breaking changes
    if (message.includes('breaking') || message.includes('!:')) {
      categories.breaking.push(commit);
    }
    // Conventional commit patterns
    else if (message.startsWith('feat:') || message.startsWith('feature:')) {
      categories.feat.push(commit);
    }
    else if (message.startsWith('fix:') || message.startsWith('bugfix:')) {
      categories.fix.push(commit);
    }
    else if (message.startsWith('docs:') || message.startsWith('doc:')) {
      categories.docs.push(commit);
    }
    else if (message.startsWith('style:')) {
      categories.style.push(commit);
    }
    else if (message.startsWith('refactor:')) {
      categories.refactor.push(commit);
    }
    else if (message.startsWith('test:')) {
      categories.test.push(commit);
    }
    else if (message.startsWith('chore:')) {
      categories.chore.push(commit);
    }
    else {
      categories.other.push(commit);
    }
  });

  return categories;
}

/**
 * Determine semantic version increment based on commit categories
 */
function determineVersionIncrement(categories, currentVersion, manualIncrement) {
  if (manualIncrement && manualIncrement !== 'auto') {
    return manualIncrement;
  }

  // Breaking changes = major
  if (categories.breaking.length > 0) {
    return 'major';
  }

  // New features = minor
  if (categories.feat.length > 0) {
    return 'minor';
  }

  // Bug fixes, docs, chores = patch
  if (categories.fix.length > 0 || categories.docs.length > 0 ||
      categories.style.length > 0 || categories.refactor.length > 0 ||
      categories.test.length > 0 || categories.chore.length > 0 ||
      categories.other.length > 0) {
    return 'patch';
  }

  // Default to patch
  return 'patch';
}

/**
 * Generate new version number
 */
function generateVersion(currentVersion, increment) {
  // Clean version string (remove 'v' prefix if present)
  const cleanVersion = currentVersion.replace(/^v/, '');

  try {
    if (semver.valid(cleanVersion)) {
      return semver.inc(cleanVersion, increment);
    } else {
      // Fallback for invalid semver
      console.log(`Invalid semver: ${cleanVersion}, using fallback versioning`);
      return '0.1.0';
    }
  } catch (error) {
    console.log(`Error parsing version: ${error.message}, using fallback`);
    return '0.1.0';
  }
}

/**
 * Get git diff for context
 */
function getGitDiff(commitCount, isPR, baseSha, headSha) {
  try {
    if (isPR && baseSha && headSha) {
      return execSync(`git log --pretty=format:"%h %s" --stat ${baseSha}..${headSha}`, { encoding: 'utf8' });
    } else {
      return execSync(`git log --pretty=format:"%h %s" --stat -n ${commitCount}`, { encoding: 'utf8' });
    }
  } catch (error) {
    console.log('Could not get git diff, continuing without it');
    return '';
  }
}

/**
 * Get current changelog content, preferring main branch version
 */
function getCurrentChangelog(changelogPath, maxLines = 100) {
  let currentChangelog = '';
  
  try {
    // Try to get from main branch first to avoid conflicts
    const fullChangelog = execSync(`git show origin/main:${changelogPath}`, { encoding: 'utf8' });
    console.log('Using latest changelog from main branch to avoid conflicts');
    
    // Extract only recent entries for context (last N lines)
    const lines = fullChangelog.split('\n');
    
    // Find the AI_APPEND_HERE marker or get last maxLines
    const markerIndex = lines.findIndex(line => line.includes('<!-- AI_APPEND_HERE -->'));
    
    if (markerIndex !== -1) {
      // Get lines from beginning up to marker (usually recent entries are at top)
      const startIndex = Math.max(0, markerIndex - maxLines);
      currentChangelog = lines.slice(startIndex, markerIndex + 1).join('\n');
      
      // Also include the header if we're cutting it off
      if (startIndex > 10) {
        const header = lines.slice(0, 10).join('\n');
        currentChangelog = header + '\n\n... [earlier entries omitted for context] ...\n\n' + currentChangelog;
      }
    } else {
      // No marker, just get last maxLines
      currentChangelog = lines.slice(-maxLines).join('\n');
    }
    
    console.log(`Using ${currentChangelog.split('\n').length} lines of changelog for context`);
  } catch (error) {
    console.log('Could not get changelog from main branch, using local version');
    if (fs.existsSync(changelogPath)) {
      const fullChangelog = fs.readFileSync(changelogPath, 'utf8');
      const lines = fullChangelog.split('\n');
      currentChangelog = lines.slice(-maxLines).join('\n');
    } else {
      console.log('Creating new changelog at', changelogPath);
      const dir = path.dirname(changelogPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      currentChangelog = '';
    }
  }

  return currentChangelog;
}

/**
 * Create the prompt for Claude
 */
function createClaudePrompt(context) {
  const {
    target,
    latestTag,
    commitCount,
    commitsData,
    changedFilesData,
    recentDiff,
    currentChangelog,
    newVersion,
    commitCategories
  } = context;

  // Create a summary of commit categories for Claude
  const categoryList = Object.entries(commitCategories)
    .filter(([_, commits]) => commits.length > 0)
    .map(([category, commits]) => `${category}: ${commits.length} commits`)
    .join(', ');

  return `Generate ONLY a raw changelog entry. No explanations, no commentary, no extra text.

CONTEXT:
- Target: ${target}
- Latest tag: ${latestTag}
- Suggested version: ${newVersion}
- Commits analyzed: ${commitCount} (ONLY from this PR/change)
- Commit categories detected: ${categoryList}

IMPORTANT: Only analyze the commits listed below. These are the NEW commits in this PR/change.
Do NOT include changes from commits that are already in the main branch.

PR/CHANGE COMMITS:
${commitsData}

PR/CHANGE CHANGED FILES:
${changedFilesData}

PR/CHANGE DIFF:
${recentDiff}

CURRENT CHANGELOG (showing recent entries for context - new version is ${newVersion}):
${currentChangelog}

STRICT OUTPUT REQUIREMENTS:
- Output MUST start with "## [${newVersion}] - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}"
- NO introductory text or explanations
- NO "Based on the analyzed commits" or similar phrases
- Include high-level summary paragraph after version header
- Use sections: Added, Changed, Fixed, Removed, Security, Technical Details (as needed)
- Focus on user-facing changes, API improvements, UI enhancements
- If no significant changes warrant a changelog entry, output exactly: "NO_UPDATE_NEEDED"

EXAMPLE OUTPUT (start exactly like this):
## [${newVersion}] - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

Brief summary of key changes introduced in this version, highlighting the most important user-facing improvements and technical enhancements.

### Added
- New feature descriptions

### Changed
- Improved functionality descriptions

### Fixed
- Bug fix descriptions

OUTPUT ONLY the changelog entry starting with "## [" or "NO_UPDATE_NEEDED". Nothing else.`;
}

/**
 * Main function to update changelog
 */
async function updateChangelog() {
  try {
    const changelogPath = process.env.CHANGELOG_PATH;
    const target = process.env.TARGET;
    const latestTag = process.env.LATEST_TAG;
    const commitCount = process.env.COMMIT_COUNT;
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
    const baseSha = process.env.PR_BASE_SHA;
    const headSha = process.env.PR_HEAD_SHA;
    const versionIncrement = process.env.VERSION_INCREMENT || 'auto';

    console.log('Updating changelog:', changelogPath);
    console.log('Target:', target);
    console.log('Latest tag:', latestTag);
    console.log('Version increment:', versionIncrement);

    // Read input data files
    const commitsData = fs.readFileSync('recent_commits.txt', 'utf8').trim();
    const changedFilesData = fs.readFileSync('changed_files.txt', 'utf8').trim();

    // Check if there are any commits to analyze
    if (!commitsData) {
      console.log('No commits found to analyze');
      fs.writeFileSync('changelog_status.txt', 'NO_UPDATE');
      return;
    }

    // Parse and categorize commits
    const commits = parseCommitData(commitsData);
    const commitCategories = categorizeCommits(commits);

    console.log('Commit categories:', Object.fromEntries(
      Object.entries(commitCategories).map(([k, v]) => [k, v.length])
    ));

    // Get additional context
    const currentChangelog = getCurrentChangelog(changelogPath);
    const recentDiff = getGitDiff(commitCount, isPR, baseSha, headSha);

    // Determine version increment and generate new version
    const increment = determineVersionIncrement(commitCategories, latestTag, versionIncrement);
    const newVersion = generateVersion(latestTag, increment);

    console.log(`Version increment: ${increment}, New version: ${newVersion}`);

    // Create context for Claude
    const context = {
      target,
      latestTag,
      commitCount,
      commitsData,
      changedFilesData,
      recentDiff,
      currentChangelog,
      newVersion,
      commitCategories
    };

    const prompt = createClaudePrompt(context);

    console.log('Calling Claude API...');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }]
    });

    let newChangelogContent = response.content[0].text.trim();

    if (newChangelogContent === 'NO_UPDATE_NEEDED') {
      console.log('Claude determined no changelog update is needed');
      fs.writeFileSync('changelog_status.txt', 'NO_UPDATE');
      return;
    }

    // Clean up any extra text that doesn't belong in changelog
    // Remove any text before the first "## [" version header
    const versionHeaderMatch = newChangelogContent.match(/^(.*?)(## \[)/s);
    if (versionHeaderMatch && versionHeaderMatch[1].trim()) {
      console.log('Removing extra text before version header:', versionHeaderMatch[1].trim());
      newChangelogContent = newChangelogContent.replace(versionHeaderMatch[1], '');
    }

    // Insert new content before AI_APPEND_HERE marker or append to end
    let finalChangelog;
    if (currentChangelog.includes('<!-- AI_APPEND_HERE -->')) {
      // Insert before the marker to preserve it
      finalChangelog = currentChangelog.replace(
        /<!-- AI_APPEND_HERE -->/,
        `${newChangelogContent}\n\n<!-- AI_APPEND_HERE -->`
      );
    } else {
      // No marker found, append to end and add marker
      finalChangelog = currentChangelog;
      if (!finalChangelog.endsWith('\n')) {
        finalChangelog += '\n';
      }
      finalChangelog += '\n' + newChangelogContent + '\n\n<!-- AI_APPEND_HERE -->';
    }

    // Write files
    fs.writeFileSync(changelogPath, finalChangelog);

    // Save the new content WITHOUT the AI_APPEND_HERE marker (it will be added during file write)
    fs.writeFileSync('new_content.txt', newChangelogContent);
    fs.writeFileSync('changelog_status.txt', 'UPDATED');

    // Save version info
    fs.writeFileSync('version_info.txt', JSON.stringify({
      version: newVersion,
      increment: increment,
      previousVersion: latestTag
    }));

    console.log('Successfully updated', changelogPath);
    console.log('New version:', newVersion);
    console.log('New content preview:', newChangelogContent.substring(0, 500) + '...');

  } catch (error) {
    console.error('Error updating changelog:', error);
    fs.writeFileSync('changelog_status.txt', 'ERROR');
    process.exit(1);
  }
}

// Run the function
updateChangelog();

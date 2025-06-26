#!/usr/bin/env node

/**
 * Deploy Updates Script
 * 
 * This script commits and pushes all changes to GitHub,
 * which will trigger Vercel deployment automatically.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[DEPLOY] ${message}`);
}

function executeCommand(command, description) {
  try {
    log(`${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`);
    throw error;
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim();
  } catch (error) {
    log('❌ Failed to check git status');
    throw error;
  }
}

function updateVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Increment patch version
  const versionParts = packageJson.version.split('.');
  versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
  packageJson.version = versionParts.join('.');
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`📦 Version updated to ${packageJson.version}`);
  
  return packageJson.version;
}

function main() {
  log('🚀 Starting deployment process...');
  
  try {
    // Check if we're in a git repository
    executeCommand('git rev-parse --git-dir', 'Checking git repository');
    
    // Check for uncommitted changes
    const changes = checkGitStatus();
    if (!changes) {
      log('ℹ️ No changes to commit');
      return;
    }
    
    log('📝 Found changes to commit:');
    console.log(changes);
    
    // Update version
    const newVersion = updateVersion();
    
    // Add all changes
    executeCommand('git add .', 'Adding all changes');
    
    // Create commit message
    const commitMessage = `feat: Enhanced admin controls and widget targeting v${newVersion}

- Added user percentage targeting (0-100% of users)
- Added test mode for debugging
- Added device targeting (desktop/mobile/tablet)
- Added time-based display rules
- Added page load triggers (immediate/delay/scroll/exit-intent)
- Enhanced admin dashboard with quick controls
- Updated widget embed script with advanced targeting
- Improved settings UI with new configuration options

This update provides comprehensive control over when and to whom
the Bargain Hunter widget is displayed, enabling better A/B testing
and targeted marketing campaigns.`;
    
    // Commit changes
    executeCommand(`git commit -m "${commitMessage}"`, 'Committing changes');
    
    // Push to GitHub
    executeCommand('git push origin main', 'Pushing to GitHub');
    
    log('🎉 Deployment completed successfully!');
    log('📡 Vercel will automatically deploy the changes');
    log(`🔗 Check deployment status at: https://vercel.com/dashboard`);
    
  } catch (error) {
    log('💥 Deployment failed');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };

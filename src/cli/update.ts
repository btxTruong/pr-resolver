import { Command } from 'commander';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import chalk from 'chalk';

const PACKAGE_NAME = 'pr-resolver';
const NETWORK_TIMEOUT_MS = 30000;
const UPDATE_TIMEOUT_MS = 120000;

function getCurrentVersion(): string {
  const require = createRequire(import.meta.url);
  const packageJson = require('../../package.json');
  return packageJson.version;
}

function getLatestVersion(): string | null {
  try {
    const result = execSync(`npm view ${PACKAGE_NAME} version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: NETWORK_TIMEOUT_MS,
    });
    return result.trim();
  } catch {
    return null;
  }
}

function executeUpdate(): void {
  execSync(`npm install -g ${PACKAGE_NAME}@latest`, {
    stdio: 'inherit',
    timeout: UPDATE_TIMEOUT_MS,
  });
}

export function createUpdateCommand(): Command {
  const update = new Command('update')
    .description('Update pr-resolver to the latest version')
    .action(async () => {
      try {
        console.log(chalk.dim('Checking for updates...'));

        const currentVersion = getCurrentVersion();
        const latestVersion = getLatestVersion();

        if (!latestVersion) {
          console.error(chalk.red('Failed to fetch latest version from npm registry'));
          process.exit(1);
        }

        if (currentVersion === latestVersion) {
          console.log(chalk.green(`✓ Already on latest version (${currentVersion})`));
          return;
        }

        console.log(chalk.yellow(`Current: ${currentVersion} → Latest: ${latestVersion}`));
        console.log(chalk.dim('Updating...'));

        executeUpdate();

        console.log(chalk.green(`✓ Updated to ${latestVersion}`));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red(`Update failed: ${message}`));
        console.log(chalk.dim('Try running manually: npm install -g pr-resolver@latest'));
        process.exit(1);
      }
    });

  return update;
}

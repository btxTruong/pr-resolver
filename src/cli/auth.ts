import { Command } from 'commander';
import { createInterface, Interface } from 'node:readline/promises';
import chalk from 'chalk';
import {
  addAccount,
  getAccounts,
  removeAccount,
  getConfigPath,
} from '../config/manager.js';

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const GITHUB_TOKEN_PATTERN = /^(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}$/;
const TOKEN_PREVIEW_SUFFIX_LENGTH = 4;

function validateAccountName(name: string): boolean {
  return name.length > 0 && ACCOUNT_NAME_PATTERN.test(name);
}

function validateTokenFormat(token: string): boolean {
  return GITHUB_TOKEN_PATTERN.test(token);
}

function getTokenPreview(token: string): string {
  if (token.length <= TOKEN_PREVIEW_SUFFIX_LENGTH) {
    return '****';
  }
  return '****' + token.slice(-TOKEN_PREVIEW_SUFFIX_LENGTH);
}

async function prompt(question: string, masked = false): Promise<string> {
  let readline: Interface | null = null;
  try {
    readline = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (masked) {
      process.stdout.write(question);
      const answer = await new Promise<string>((resolve, reject) => {
        let input = '';
        const stdin = process.stdin;
        const wasRaw = stdin.isRaw;

        stdin.setRawMode?.(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        const onData = (char: string) => {
          if (char === '\n' || char === '\r') {
            stdin.setRawMode?.(wasRaw ?? false);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(input);
          } else if (char === '\u0003') {
            stdin.setRawMode?.(wasRaw ?? false);
            stdin.removeListener('data', onData);
            reject(new Error('User cancelled'));
          } else if (char === '\u007F' || char === '\b') {
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.write('\b \b');
            }
          } else {
            input += char;
            process.stdout.write('*');
          }
        };

        stdin.on('data', onData);
      });
      return answer.trim();
    }

    const answer = await readline.question(question);
    return answer.trim();
  } finally {
    readline?.close();
  }
}

async function promptForToken(): Promise<string> {
  return prompt('GitHub token: ', true);
}

async function promptForOrgs(): Promise<string[]> {
  const orgsInput = await prompt('Orgs (comma-separated, or empty): ');
  if (!orgsInput) {
    return [];
  }
  return orgsInput.split(',').map((s) => s.trim()).filter(Boolean);
}

export function createAuthCommand(): Command {
  const auth = new Command('auth').description('Manage GitHub accounts');

  auth
    .command('add <name>')
    .description('Add a GitHub account')
    .action(async (name: string) => {
      try {
        if (!validateAccountName(name)) {
          console.error(chalk.red('Invalid account name. Use alphanumeric, dash, or underscore only.'));
          process.exit(1);
        }

        const token = await promptForToken();
        if (!token) {
          console.error(chalk.red('Token is required'));
          process.exit(1);
        }

        if (!validateTokenFormat(token)) {
          console.error(chalk.red('Invalid token format. Expected GitHub token (ghp_*, gho_*, etc.)'));
          process.exit(1);
        }

        const orgs = await promptForOrgs();
        addAccount(name, token, orgs);

        console.log(chalk.green(`✓ Added account: ${name}`));
        if (orgs.length > 0) {
          console.log(chalk.dim(`  Orgs: ${orgs.join(', ')}`));
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'User cancelled') {
          console.log(chalk.yellow('\nCancelled'));
          process.exit(0);
        }
        console.error(chalk.red(`Failed to add account: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  auth
    .command('list')
    .description('List configured accounts')
    .action(() => {
      try {
        const accounts = getAccounts();
        const names = Object.keys(accounts);

        if (names.length === 0) {
          console.log(chalk.yellow('No accounts configured'));
          console.log(chalk.dim(`Run: pr-resolver auth add <name>`));
          return;
        }

        console.log(chalk.bold('Configured accounts:\n'));
        for (const name of names) {
          const account = accounts[name];
          const tokenPreview = getTokenPreview(account.token);
          console.log(`  ${chalk.cyan(name)}`);
          console.log(`    Token: ${chalk.dim(tokenPreview)}`);
          if (account.orgs.length > 0) {
            console.log(`    Orgs:  ${account.orgs.join(', ')}`);
          }
          console.log();
        }

        console.log(chalk.dim(`Config: ${getConfigPath()}`));
      } catch (error) {
        console.error(chalk.red(`Failed to list accounts: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  auth
    .command('remove <name>')
    .description('Remove a GitHub account')
    .action((name: string) => {
      try {
        const removed = removeAccount(name);
        if (removed) {
          console.log(chalk.green(`✓ Removed account: ${name}`));
        } else {
          console.error(chalk.red(`Account not found: ${name}`));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red(`Failed to remove account: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });

  return auth;
}

import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import {
  addAccount,
  getAccounts,
  removeAccount,
  getConfigPath,
} from '../config/manager.js';

async function promptForToken(): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const token = await readline.question('GitHub token: ');
  readline.close();
  return token.trim();
}

async function promptForOrgs(): Promise<string[]> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const orgsInput = await readline.question('Orgs (comma-separated, or empty): ');
  readline.close();

  if (!orgsInput.trim()) {
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
      const token = await promptForToken();
      if (!token) {
        console.error(chalk.red('Token is required'));
        process.exit(1);
      }

      const orgs = await promptForOrgs();
      addAccount(name, token, orgs);

      console.log(chalk.green(`✓ Added account: ${name}`));
      if (orgs.length > 0) {
        console.log(chalk.dim(`  Orgs: ${orgs.join(', ')}`));
      }
    });

  auth
    .command('list')
    .description('List configured accounts')
    .action(() => {
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
        const tokenPreview = account.token.slice(0, 7) + '...';
        console.log(`  ${chalk.cyan(name)}`);
        console.log(`    Token: ${chalk.dim(tokenPreview)}`);
        if (account.orgs.length > 0) {
          console.log(`    Orgs:  ${account.orgs.join(', ')}`);
        }
        console.log();
      }

      console.log(chalk.dim(`Config: ${getConfigPath()}`));
    });

  auth
    .command('remove <name>')
    .description('Remove a GitHub account')
    .action((name: string) => {
      const removed = removeAccount(name);
      if (removed) {
        console.log(chalk.green(`✓ Removed account: ${name}`));
      } else {
        console.error(chalk.red(`Account not found: ${name}`));
        process.exit(1);
      }
    });

  return auth;
}

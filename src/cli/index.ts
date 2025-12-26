import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import chalk from 'chalk';
import { createRequire } from 'node:module';
import { createAuthCommand } from './auth.js';
import { createUpdateCommand } from './update.js';
import { createMeCommand } from './me.js';
import { handlePRCommand } from './pr.js';
import { App } from '../ui/App.js';
import { getDefaultShowResolved } from '../config/manager.js';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

const program = new Command();

program
  .name('pr-resolver')
  .description('View and resolve GitHub PR comments')
  .version(packageJson.version);

program.addCommand(createAuthCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createMeCommand());

program
  .argument('[pr-number]', 'PR number to view (omit to list open PRs)')
  .option('-a, --all', 'Show resolved comments too')
  .action(async (prNumberArg: string | undefined, options: { all?: boolean }) => {
    const prNumber = prNumberArg ? parseInt(prNumberArg, 10) : undefined;

    if (prNumberArg && (isNaN(prNumber!) || prNumber! <= 0)) {
      console.error(chalk.red('PR number must be a positive integer'));
      process.exit(1);
    }

    const result = await handlePRCommand(prNumber);

    if (result) {
      const showResolved = options.all ?? getDefaultShowResolved();

      render(
        React.createElement(App, {
          prData: result.prData,
          token: result.token,
          owner: result.owner,
          repo: result.repo,
          initialShowResolved: showResolved,
        })
      );
    }
  });

program.parse();

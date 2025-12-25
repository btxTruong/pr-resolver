import { Command } from 'commander';
import chalk from 'chalk';
import { detectRepo } from '../git/detect.js';
import { fetchUserOpenPRs } from '../api/graphql.js';
import { resolveToken, handleAPIError } from './shared.js';

async function handleMeCommand(): Promise<void> {
  const repoInfo = detectRepo();
  if (!repoInfo) {
    console.error(chalk.red('Not in a git repository or no origin remote found'));
    console.error(chalk.dim('Run this command from within a git repository'));
    process.exit(1);
  }

  const token = resolveToken(repoInfo);
  if (!token) {
    console.error(chalk.red('No GitHub account configured'));
    console.error(chalk.dim('Run: pr-resolver auth add <name>'));
    process.exit(1);
  }

  console.log(chalk.dim(`Repository: ${repoInfo.owner}/${repoInfo.repo}`));
  console.log(chalk.dim('Fetching your open PRs...'));

  try {
    const prs = await fetchUserOpenPRs(token, repoInfo.owner, repoInfo.repo);

    if (prs.length === 0) {
      console.log(chalk.yellow('No open pull requests authored by you'));
      return;
    }

    console.log(chalk.bold('\nYour Open Pull Requests:\n'));
    for (const pr of prs) {
      const threadInfo = pr.threadCount > 0 ? chalk.yellow(` (${pr.threadCount} threads)`) : '';
      console.log(`  ${chalk.cyan(`#${pr.number}`)} ${pr.title}${threadInfo}`);
    }

    console.log(chalk.dim('\nRun: pr-resolver <number> to view comments'));
  } catch (error) {
    handleAPIError(error);
  }
}

export function createMeCommand(): Command {
  const command = new Command('me');

  command
    .description('List your open PRs in the current repository')
    .action(handleMeCommand);

  return command;
}

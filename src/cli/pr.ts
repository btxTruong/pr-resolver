import chalk from 'chalk';
import { detectRepo } from '../git/detect.js';
import { findAccountForOrg, getFirstAccount } from '../config/manager.js';
import { fetchPRComments, fetchOpenPRs, GraphQLError } from '../api/graphql.js';
import type { PRData, RepoInfo } from '../types/index.js';

interface PRCommandOptions {
  all?: boolean;
}

export interface PRCommandResult {
  prData: PRData;
  token: string;
}

function resolveToken(repoInfo: RepoInfo): string | null {
  const orgMatch = findAccountForOrg(repoInfo.owner);
  if (orgMatch) {
    return orgMatch.account.token;
  }

  const firstAccount = getFirstAccount();
  if (firstAccount) {
    return firstAccount.account.token;
  }

  return null;
}

export async function handlePRCommand(
  prNumber: number | undefined,
  options: PRCommandOptions
): Promise<PRCommandResult | null> {
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

  if (prNumber === undefined) {
    await handlePRList(token, repoInfo);
    return null;
  }

  return await handlePRView(token, repoInfo, prNumber);
}

async function handlePRList(token: string, repoInfo: RepoInfo): Promise<null> {
  console.log(chalk.dim('Fetching open PRs...'));

  try {
    const prs = await fetchOpenPRs(token, repoInfo.owner, repoInfo.repo);

    if (prs.length === 0) {
      console.log(chalk.yellow('No open pull requests'));
      return null;
    }

    console.log(chalk.bold('\nOpen Pull Requests:\n'));
    for (const pr of prs) {
      const threadInfo = pr.threadCount > 0 ? chalk.yellow(` (${pr.threadCount} threads)`) : '';
      console.log(`  ${chalk.cyan(`#${pr.number}`)} ${pr.title}${threadInfo}`);
      console.log(chalk.dim(`    by @${pr.author}`));
    }

    console.log(chalk.dim('\nRun: pr-resolver <number> to view comments'));
  } catch (error) {
    handleAPIError(error);
  }

  return null;
}

async function handlePRView(
  token: string,
  repoInfo: RepoInfo,
  prNumber: number
): Promise<PRCommandResult | null> {
  console.log(chalk.dim(`Fetching PR #${prNumber}...`));

  try {
    const prData = await fetchPRComments(token, repoInfo.owner, repoInfo.repo, prNumber);
    return { prData, token };
  } catch (error) {
    handleAPIError(error);
    return null;
  }
}

function handleAPIError(error: unknown): never {
  if (error instanceof GraphQLError) {
    switch (error.code) {
      case 'REPO_NOT_FOUND':
      case 'PR_NOT_FOUND':
        console.error(chalk.red('Repository or PR not found'));
        break;
      default:
        console.error(chalk.red(`API Error: ${error.message}`));
    }
  } else if (error instanceof Error) {
    if (error.message.includes('401')) {
      console.error(chalk.red('Authentication failed - check your token'));
    } else if (error.message.includes('403')) {
      console.error(chalk.red('Access denied - token may lack permissions'));
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  } else {
    console.error(chalk.red('Unknown error occurred'));
  }
  process.exit(1);
}

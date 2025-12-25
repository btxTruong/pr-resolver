import chalk from 'chalk';
import { findAccountForOrg, getFirstAccount } from '../config/manager.js';
import { GraphQLError } from '../api/graphql.js';
import type { RepoInfo } from '../types/index.js';

export function resolveToken(repoInfo: RepoInfo): string | null {
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

export function handleAPIError(error: unknown): never {
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

import { graphql } from '@octokit/graphql';
import { GET_PR_COMMENTS, GET_OPEN_PRS, RESOLVE_THREAD, GET_VIEWER_LOGIN, GET_USER_OPEN_PRS } from './queries.js';
import { GraphQLError, validateToken, validateRepoParams, validatePRNumber, validateThreadId } from './validation.js';
import type { GraphQLPRResponse, GraphQLOpenPRsResponse, ResolveThreadResponse, GraphQLCommentNode, GraphQLViewerLoginResponse, GraphQLSearchPRsResponse } from './graphql-types.js';
import type { PRData, ReviewThread, ReviewComment, OpenPR, ResolveResult } from '../types/index.js';

export { GraphQLError } from './validation.js';

export function createClient(token: string) {
  return graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });
}

function mapComment(comment: GraphQLCommentNode): ReviewComment {
  return {
    body: comment.body,
    author: comment.author?.login ?? 'ghost',
    createdAt: comment.createdAt,
  };
}

export async function fetchPRComments(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRData> {
  validateToken(token);
  validateRepoParams(owner, repo);
  validatePRNumber(prNumber);

  try {
    const client = createClient(token);
    const response = await client<GraphQLPRResponse>(GET_PR_COMMENTS, { owner, repo, pr: prNumber });

    if (!response.repository) {
      throw new GraphQLError(`Repository ${owner}/${repo} not found`, 'REPO_NOT_FOUND');
    }

    if (!response.repository.pullRequest) {
      throw new GraphQLError(`Pull request #${prNumber} not found in ${owner}/${repo}`, 'PR_NOT_FOUND');
    }

    const pullRequest = response.repository.pullRequest;

    const reviewThreads: ReviewThread[] = pullRequest.reviewThreads.nodes.map((thread) => ({
      id: thread.id,
      isResolved: thread.isResolved,
      path: thread.path,
      line: thread.line,
      comments: thread.comments.nodes.map(mapComment),
    }));

    return {
      title: pullRequest.title,
      number: pullRequest.number,
      reviewThreads,
    };
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Failed to fetch PR comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FETCH_FAILED',
      error
    );
  }
}

export async function fetchOpenPRs(token: string, owner: string, repo: string): Promise<OpenPR[]> {
  validateToken(token);
  validateRepoParams(owner, repo);

  try {
    const client = createClient(token);
    const response = await client<GraphQLOpenPRsResponse>(GET_OPEN_PRS, { owner, repo });

    if (!response.repository) {
      throw new GraphQLError(`Repository ${owner}/${repo} not found`, 'REPO_NOT_FOUND');
    }

    return response.repository.pullRequests.nodes.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.author?.login ?? 'ghost',
      updatedAt: pr.updatedAt,
      threadCount: pr.reviewThreads.totalCount,
    }));
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Failed to fetch open PRs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FETCH_FAILED',
      error
    );
  }
}

export async function fetchViewerLogin(token: string): Promise<string> {
  validateToken(token);

  try {
    const client = createClient(token);
    const response = await client<GraphQLViewerLoginResponse>(GET_VIEWER_LOGIN);
    return response.viewer.login;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Failed to fetch viewer login: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FETCH_FAILED',
      error
    );
  }
}

export async function fetchUserOpenPRs(token: string, owner: string, repo: string): Promise<OpenPR[]> {
  validateToken(token);
  validateRepoParams(owner, repo);

  try {
    const viewerLogin = await fetchViewerLogin(token);
    const client = createClient(token);
    const searchQuery = `repo:${owner}/${repo} is:pr is:open author:${viewerLogin}`;
    const response = await client<GraphQLSearchPRsResponse>(GET_USER_OPEN_PRS, { searchQuery });

    return response.search.nodes
      .filter((node) => node.number !== undefined)
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        author: pr.author?.login ?? 'ghost',
        updatedAt: pr.updatedAt,
        threadCount: pr.reviewThreads.totalCount,
      }));
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Failed to fetch user's open PRs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'FETCH_FAILED',
      error
    );
  }
}

export async function resolveThread(token: string, threadId: string): Promise<boolean> {
  validateToken(token);
  validateThreadId(threadId);

  try {
    const client = createClient(token);
    const response = await client<ResolveThreadResponse>(RESOLVE_THREAD, { threadId });
    return response.resolveReviewThread.thread.isResolved;
  } catch (error) {
    if (error instanceof GraphQLError) throw error;
    throw new GraphQLError(
      `Failed to resolve thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'RESOLVE_FAILED',
      error
    );
  }
}

export async function resolveAllThreads(token: string, threads: ReviewThread[]): Promise<ResolveResult> {
  validateToken(token);

  const unresolvedThreads = threads.filter((thread) => !thread.isResolved);

  const results = await Promise.allSettled(
    unresolvedThreads.map(async (thread) => {
      await resolveThread(token, thread.id);
      return thread.id;
    })
  );

  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  results.forEach((result, index) => {
    const threadId = unresolvedThreads[index].id;
    if (result.status === 'fulfilled') {
      succeeded.push(threadId);
    } else {
      failed.push({
        id: threadId,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      });
    }
  });

  return { succeeded, failed };
}

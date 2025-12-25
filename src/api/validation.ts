export class GraphQLError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'GraphQLError';
  }
}

export function validateToken(token: string): void {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    throw new GraphQLError('Invalid token: token must be a non-empty string', 'INVALID_TOKEN');
  }
}

export function validateRepoParams(owner: string, repo: string): void {
  if (!owner || typeof owner !== 'string' || owner.trim().length === 0) {
    throw new GraphQLError('Invalid owner: must be a non-empty string', 'INVALID_OWNER');
  }
  if (!repo || typeof repo !== 'string' || repo.trim().length === 0) {
    throw new GraphQLError('Invalid repo: must be a non-empty string', 'INVALID_REPO');
  }
}

export function validatePRNumber(prNumber: number): void {
  if (!Number.isInteger(prNumber) || prNumber < 1) {
    throw new GraphQLError('Invalid PR number: must be a positive integer', 'INVALID_PR_NUMBER');
  }
}

export function validateThreadId(threadId: string): void {
  if (!threadId || typeof threadId !== 'string' || threadId.trim().length === 0) {
    throw new GraphQLError('Invalid thread ID: must be a non-empty string', 'INVALID_THREAD_ID');
  }
}

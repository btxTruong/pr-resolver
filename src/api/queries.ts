export const GET_PR_COMMENTS = `
  query GetPRComments($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        title
        number
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 50) {
              nodes {
                body
                author { login }
                createdAt
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_OPEN_PRS = `
  query GetOpenPRs($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 20, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          number
          title
          author { login }
          updatedAt
          reviewThreads(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`;

export const RESOLVE_THREAD = `
  mutation ResolveThread($threadId: ID!) {
    resolveReviewThread(input: {threadId: $threadId}) {
      thread {
        id
        isResolved
      }
    }
  }
`;

export const UNRESOLVE_THREAD = `
  mutation UnresolveThread($threadId: ID!) {
    unresolveReviewThread(input: {threadId: $threadId}) {
      thread {
        id
        isResolved
      }
    }
  }
`;

export const GET_VIEWER_LOGIN = `
  query GetViewerLogin {
    viewer {
      login
    }
  }
`;

export const GET_USER_OPEN_PRS = `
  query GetUserOpenPRs($searchQuery: String!) {
    search(query: $searchQuery, type: ISSUE, first: 20) {
      nodes {
        ... on PullRequest {
          number
          title
          author { login }
          updatedAt
          reviewThreads(first: 1) {
            totalCount
          }
        }
      }
    }
  }
`;

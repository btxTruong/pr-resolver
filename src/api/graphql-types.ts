export interface GraphQLCommentNode {
  body: string;
  author: { login: string } | null;
  createdAt: string;
}

export interface GraphQLThreadNode {
  id: string;
  isResolved: boolean;
  path: string | null;
  line: number | null;
  comments: {
    nodes: GraphQLCommentNode[];
  };
}

export interface GraphQLPRResponse {
  repository: {
    pullRequest: {
      title: string;
      number: number;
      reviewThreads: {
        nodes: GraphQLThreadNode[];
      };
    } | null;
  } | null;
}

export interface GraphQLOpenPRsResponse {
  repository: {
    pullRequests: {
      nodes: Array<{
        number: number;
        title: string;
        author: { login: string } | null;
        updatedAt: string;
        reviewThreads: { totalCount: number };
      }>;
    };
  } | null;
}

export interface ResolveThreadResponse {
  resolveReviewThread: { thread: { isResolved: boolean } };
}

export interface UnresolveThreadResponse {
  unresolveReviewThread: { thread: { isResolved: boolean } };
}

export interface GraphQLViewerLoginResponse {
  viewer: {
    login: string;
  };
}

export interface GraphQLSearchPRsResponse {
  search: {
    nodes: Array<{
      number: number;
      title: string;
      author: { login: string } | null;
      updatedAt: string;
      reviewThreads: { totalCount: number };
    }>;
  };
}

export interface Account {
  token: string;
  orgs: string[];
}

export interface Config {
  accounts: Record<string, Account>;
  defaults: {
    showResolved: boolean;
  };
}

export interface RepoInfo {
  owner: string;
  repo: string;
  host: string;
}

export interface ReviewComment {
  body: string;
  author: string;
  createdAt: string;
}

export interface ReviewThread {
  id: string;
  isResolved: boolean;
  path: string | null;
  line: number | null;
  comments: ReviewComment[];
}

export interface PRData {
  title: string;
  number: number;
  reviewThreads: ReviewThread[];
  generalComments: ReviewComment[];
}

export interface OpenPR {
  number: number;
  title: string;
  author: string;
  updatedAt: string;
  threadCount: number;
}

export interface ResolveResult {
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
}

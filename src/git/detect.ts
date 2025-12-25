import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { RepoInfo } from '../types/index.js';

export function findGitRoot(startPath: string = process.cwd()): string | null {
  let currentPath = startPath;

  while (true) {
    const gitPath = join(currentPath, '.git');
    if (existsSync(gitPath)) {
      return currentPath;
    }

    const parent = dirname(currentPath);
    if (parent === currentPath) {
      return null;
    }
    currentPath = parent;
  }
}

export function parseRemoteUrl(url: string): RepoInfo | null {
  const httpsMatch = url.match(/https?:\/\/([^/]+)\/([^/]+)\/([^/.]+)(?:\.git)?/);
  if (httpsMatch) {
    return {
      host: httpsMatch[1],
      owner: httpsMatch[2],
      repo: httpsMatch[3],
    };
  }

  const sshMatch = url.match(/git@([^:]+):([^/]+)\/([^/.]+)(?:\.git)?/);
  if (sshMatch) {
    return {
      host: sshMatch[1],
      owner: sshMatch[2],
      repo: sshMatch[3],
    };
  }

  return null;
}

export function getGitConfig(gitRoot: string): string | null {
  const configPath = join(gitRoot, '.git', 'config');
  if (!existsSync(configPath)) {
    return null;
  }
  return readFileSync(configPath, 'utf-8');
}

export function extractOriginUrl(configContent: string): string | null {
  const lines = configContent.split('\n');
  let inOriginSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toLowerCase() === '[remote "origin"]') {
      inOriginSection = true;
      continue;
    }

    if (inOriginSection && trimmed.startsWith('[')) {
      break;
    }

    if (inOriginSection && trimmed.startsWith('url = ')) {
      return trimmed.slice(6).trim();
    }
  }

  return null;
}

export function detectRepo(): RepoInfo | null {
  const gitRoot = findGitRoot();
  if (!gitRoot) {
    return null;
  }

  const configContent = getGitConfig(gitRoot);
  if (!configContent) {
    return null;
  }

  const originUrl = extractOriginUrl(configContent);
  if (!originUrl) {
    return null;
  }

  return parseRemoteUrl(originUrl);
}

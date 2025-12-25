import React from 'react';
import { Box, Text } from 'ink';
import { ThreadItem } from './ThreadItem.js';
import type { ReviewThread, ReviewComment } from '../types/index.js';

interface FileGroup {
  path: string;
  threads: ReviewThread[];
}

interface CommentListProps {
  reviewThreads: ReviewThread[];
  generalComments: ReviewComment[];
  showResolved: boolean;
  selectedIndex: number;
  expandedIndex: number | null;
}

const NO_FILE_PATH = '(no file)';

function groupByFile(threads: ReviewThread[]): FileGroup[] {
  const groups = new Map<string, ReviewThread[]>();

  for (const thread of threads) {
    const path = thread.path ?? NO_FILE_PATH;
    const existing = groups.get(path);
    if (existing) {
      existing.push(thread);
    } else {
      groups.set(path, [thread]);
    }
  }

  return Array.from(groups.entries()).map(([filePath, fileThreads]) => ({
    path: filePath,
    threads: fileThreads,
  }));
}

export function CommentList({
  reviewThreads,
  generalComments,
  showResolved,
  selectedIndex,
  expandedIndex,
}: CommentListProps) {
  const filteredThreads = showResolved
    ? reviewThreads
    : reviewThreads.filter((thread) => !thread.isResolved);

  const fileGroups = groupByFile(filteredThreads);

  let currentIndex = 0;

  return (
    <Box flexDirection="column" paddingX={1}>
      {fileGroups.map((group) => (
        <Box key={group.path} flexDirection="column" marginBottom={1}>
          <Text bold color="blue">
            📁 {group.path} ({group.threads.length} threads)
          </Text>
          {group.threads.map((thread) => {
            const thisIndex = currentIndex++;
            return (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isSelected={thisIndex === selectedIndex}
                isExpanded={thisIndex === expandedIndex}
              />
            );
          })}
        </Box>
      ))}

      {generalComments.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="magenta">
            💬 General Comments ({generalComments.length})
          </Text>
          {generalComments.map((comment) => (
            <Box key={`${comment.author}-${comment.createdAt}`} marginLeft={2}>
              <Text>  @{comment.author}: </Text>
              <Text dimColor>{comment.body}</Text>
            </Box>
          ))}
        </Box>
      )}

      {filteredThreads.length === 0 && generalComments.length === 0 && (
        <Text color="green">✓ No comments to show</Text>
      )}
    </Box>
  );
}

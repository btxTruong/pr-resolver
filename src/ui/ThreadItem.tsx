import React from 'react';
import { Box, Text } from 'ink';
import type { ReviewThread } from '../types/index.js';

interface ThreadItemProps {
  thread: ReviewThread;
  isSelected: boolean;
  isExpanded: boolean;
}

export function ThreadItem({ thread, isSelected, isExpanded }: ThreadItemProps) {
  if (thread.comments.length === 0) {
    return null;
  }

  const statusColor = thread.isResolved ? 'green' : 'yellow';
  const statusText = thread.isResolved ? 'resolved' : 'UNRESOLVED';
  const firstComment = thread.comments[0];

  const prefix = isSelected ? '▶ ' : '  ';
  const singleLineBody = firstComment.body.replace(/\s+/g, ' ');
  const truncatedBody = singleLineBody.length > 60
    ? singleLineBody.slice(0, 60) + '...'
    : singleLineBody;

  return (
    <Box flexDirection="column" marginLeft={2}>
      <Box>
        <Text color={isSelected ? 'cyan' : undefined}>
          {prefix}
        </Text>
        <Text color={statusColor}>[{statusText}]</Text>
        <Text> @{firstComment.author}: </Text>
        <Text dimColor={!isSelected}>
          {isExpanded ? firstComment.body : truncatedBody}
        </Text>
      </Box>

      {isExpanded && thread.comments.length > 1 && (
        <Box flexDirection="column" marginLeft={4} marginTop={1}>
          {thread.comments.slice(1).map((comment, index) => (
            <Box key={index} marginBottom={1}>
              <Text dimColor>└─ @{comment.author}: </Text>
              <Text>{comment.body}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

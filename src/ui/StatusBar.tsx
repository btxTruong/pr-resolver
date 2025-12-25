import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  showResolved: boolean;
  totalThreads: number;
  unresolvedCount: number;
}

export function StatusBar({ showResolved, totalThreads, unresolvedCount }: StatusBarProps) {
  return (
    <Box
      borderStyle="single"
      borderTop={true}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
      marginTop={1}
    >
      <Box flexGrow={1}>
        <Text dimColor>
          [↑↓] Navigate  [Enter] Expand  [r] Resolve  [R] Resolve All  [a] Toggle resolved  [q] Quit
        </Text>
      </Box>
      <Box>
        <Text>
          {unresolvedCount}/{totalThreads} unresolved
          {showResolved ? '' : ' (hiding resolved)'}
        </Text>
      </Box>
    </Box>
  );
}

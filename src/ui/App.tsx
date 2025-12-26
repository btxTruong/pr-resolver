import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { CommentList } from './CommentList.js';
import { StatusBar } from './StatusBar.js';
import { resolveThread, resolveAllThreads, unresolveThread, fetchPRComments } from '../api/graphql.js';
import type { PRData, ReviewThread } from '../types/index.js';

interface AppProps {
  prData: PRData;
  token: string;
  owner: string;
  repo: string;
  initialShowResolved: boolean;
}

export function App({ prData, token, owner, repo, initialShowResolved }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [threads, setThreads] = useState<ReviewThread[]>(prData.reviewThreads);
  const [showResolved, setShowResolved] = useState(initialShowResolved);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const terminalHeight = stdout?.rows ?? 24;

  const filteredThreads = showResolved
    ? threads
    : threads.filter((thread) => !thread.isResolved);

  const displayOrderedThreads = React.useMemo(() => {
    const groups = new Map<string, ReviewThread[]>();
    for (const thread of filteredThreads) {
      const path = thread.path ?? '(no file)';
      const existing = groups.get(path);
      if (existing) {
        existing.push(thread);
      } else {
        groups.set(path, [thread]);
      }
    }
    return Array.from(groups.values()).flat();
  }, [filteredThreads]);

  const unresolvedCount = threads.filter((thread) => !thread.isResolved).length;

  useEffect(() => {
    if (selectedIndex >= displayOrderedThreads.length && displayOrderedThreads.length > 0) {
      setSelectedIndex(displayOrderedThreads.length - 1);
    }
  }, [displayOrderedThreads.length, selectedIndex]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const showMessage = useCallback((msg: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setMessage(msg);
    messageTimeoutRef.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  const handleResolve = useCallback(async () => {
    if (displayOrderedThreads.length === 0) return;

    const thread = displayOrderedThreads[selectedIndex];
    if (!thread || thread.isResolved) return;

    setIsLoading(true);
    try {
      await resolveThread(token, thread.id);
      setThreads((previous) =>
        previous.map((item) => (item.id === thread.id ? { ...item, isResolved: true } : item))
      );
      showMessage('✓ Thread resolved');
    } catch (error) {
      console.error('Failed to resolve thread:', error);
      showMessage('✗ Failed to resolve');
    }
    setIsLoading(false);
  }, [token, displayOrderedThreads, selectedIndex, showMessage]);

  const handleResolveAll = useCallback(async () => {
    const unresolved = threads.filter((thread) => !thread.isResolved);
    if (unresolved.length === 0) {
      showMessage('No unresolved threads');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resolveAllThreads(token, threads);
      setThreads((previous) =>
        previous.map((thread) => {
          if (result.succeeded.includes(thread.id)) {
            return { ...thread, isResolved: true };
          }
          return thread;
        })
      );
      if (result.failed.length > 0) {
        showMessage(`✓ Resolved ${result.succeeded.length}, failed ${result.failed.length}`);
      } else {
        showMessage(`✓ Resolved ${result.succeeded.length} threads`);
      }
    } catch (error) {
      console.error('Failed to resolve threads:', error);
      showMessage('✗ Failed to resolve some threads');
    }
    setIsLoading(false);
  }, [token, threads, showMessage]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const freshData = await fetchPRComments(token, owner, repo, prData.number);
      setThreads(freshData.reviewThreads);
      setSelectedIndex(0);
      setExpandedIndex(null);
      showMessage('✓ Refreshed');
    } catch (error) {
      console.error('Failed to refresh:', error);
      showMessage('✗ Failed to refresh');
    }
    setIsLoading(false);
  }, [token, owner, repo, prData.number, showMessage]);

  const handleUnresolve = useCallback(async () => {
    if (displayOrderedThreads.length === 0) return;

    const thread = displayOrderedThreads[selectedIndex];
    if (!thread || !thread.isResolved) return;

    setIsLoading(true);
    try {
      await unresolveThread(token, thread.id);
      setThreads((previous) =>
        previous.map((item) => (item.id === thread.id ? { ...item, isResolved: false } : item))
      );
      showMessage('✓ Thread unresolved');
    } catch (error) {
      console.error('Failed to unresolve thread:', error);
      showMessage('✗ Failed to unresolve');
    }
    setIsLoading(false);
  }, [token, displayOrderedThreads, selectedIndex, showMessage]);

  useInput((input, key) => {
    if (isLoading) return;

    if (input === 'q') {
      exit();
      return;
    }

    if (input === 'a') {
      setShowResolved((previous) => !previous);
      setSelectedIndex(0);
      setExpandedIndex(null);
      return;
    }

    if (input === 'r') {
      handleResolve();
      return;
    }

    if (input === 'x') {
      handleResolveAll();
      return;
    }

    if (input === 'u') {
      handleUnresolve();
      return;
    }

    if (input === 'f') {
      handleRefresh();
      return;
    }

    if (key.upArrow && displayOrderedThreads.length > 0) {
      setSelectedIndex((previous) => Math.max(0, previous - 1));
      setExpandedIndex(null);
    }

    if (key.downArrow && displayOrderedThreads.length > 0) {
      setSelectedIndex((previous) => Math.min(displayOrderedThreads.length - 1, previous + 1));
      setExpandedIndex(null);
    }

    if (key.return && displayOrderedThreads.length > 0) {
      setExpandedIndex((previous) => (previous === selectedIndex ? null : selectedIndex));
    }
  });

  return (
    <Box flexDirection="column" minHeight={terminalHeight}>
      <Box borderStyle="round" paddingX={1}>
        <Text bold>PR #{prData.number}: {prData.title}</Text>
      </Box>

      {message && (
        <Box marginY={1} marginLeft={2}>
          <Text color="cyan">{message}</Text>
        </Box>
      )}

      {isLoading && (
        <Box marginY={1} marginLeft={2}>
          <Text color="yellow">Loading...</Text>
        </Box>
      )}

      <Box flexDirection="column" flexGrow={1}>
        <CommentList
          reviewThreads={threads}
          showResolved={showResolved}
          selectedIndex={selectedIndex}
          expandedIndex={expandedIndex}
        />
      </Box>

      <StatusBar
        showResolved={showResolved}
        totalThreads={threads.length}
        unresolvedCount={unresolvedCount}
      />
    </Box>
  );
}

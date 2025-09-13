import { useRef, useEffect, useCallback, memo } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { ExpandLess } from '@mui/icons-material';
import type { Message } from '../../types/chat.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '../../contexts/ChatContext';
import { useSmoothAutoScroll } from '../../hooks/useSmoothAutoScroll';

interface MessageListProps {
  messages: Message[];
}

export const MessageList = memo<MessageListProps>(({ messages }) => {
  const {
    isLoadingMessages,
    hasMoreMessages,
    currentChatId,
    loadMessages,
    isSendingMessage,
  } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement>(null);
  const prevMessageCountRef = useRef(messages.length);

  const hasMore = currentChatId ? hasMoreMessages[currentChatId] : false;

  const isAITyping = messages.some(msg => msg.status === 'typing');
  const isAIThinking = messages.some(msg => msg.status === 'thinking');

  const { scrollToBottom } = useSmoothAutoScroll(
    scrollContainerRef,
    {
      enabled: isAITyping || isAIThinking || isSendingMessage,
      threshold: 100,
      behavior: 'smooth',
      resetDelay: 100,
      dependencies: [messages]
    }
  );

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newMessages = messages.slice(prevMessageCountRef.current);
      const hasNewUserMessage = newMessages.some(msg => msg.role === 'user');

      if (hasNewUserMessage) {
        scrollToBottom(true);
      }
    }

    const hasInterruptedMessage = messages.some(msg => msg.status === 'interrupted');
    if (hasInterruptedMessage) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, scrollToBottom]);

  // Scroll to bottom (the latest messages) when chat changes
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      scrollToBottom(false);
    }
  }, [currentChatId, messages.length, scrollToBottom]);

  const handleLoadMore = useCallback(() => {
    if (!currentChatId || isLoadingMessages || !hasMore) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;
    const oldScrollHeight = container.scrollHeight;
    const oldScrollTop = container.scrollTop;

    const cursor = messages.length.toString();
    loadMessages(currentChatId, cursor).then(() => {
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;

          //UX OPTIMIZATION: Maintain the same visual position by adjusting scroll to match height of current message
          container.scrollTop = oldScrollTop + heightDifference;
        }
      });
    });
  }, [currentChatId, isLoadingMessages, hasMore, messages.length, loadMessages]);

  if (messages.length === 0 && !isLoadingMessages) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No messages yet. Start a conversation!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        scrollBehavior: 'auto',
        transform: 'translateZ(0)',
        willChange: 'scroll-position',
      }}
    >
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Button
            ref={loadMoreButtonRef}
            onClick={handleLoadMore}
            disabled={isLoadingMessages}
            startIcon={isLoadingMessages ? <CircularProgress size={16} /> : <ExpandLess />}
            variant="text"
            size="small"
          >
            {isLoadingMessages ? 'Loading...' : 'Load Earlier Messages'}
          </Button>
        </Box>
      )}

      {messages.map((message) => (
        message.status === 'thinking' ? (
          <TypingIndicator key={message.id} visible={true} />
        ) : (
          <MessageBubble
            key={message.id}
            message={message}
            isTyping={
              message.role === 'assistant' &&
              message === messages[messages.length - 1] &&
              message.status === 'typing'
            }
          />
        )
      ))}

      {isLoadingMessages && messages.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
});

MessageList.displayName = 'MessageList';
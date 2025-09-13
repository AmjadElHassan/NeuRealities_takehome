import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Message, ChatState } from '../types/chat.types';
import { mockApi } from '../services/mockResponses';
import { useAuth } from './AuthContext';

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  cancelMessage: (isInterruption: boolean) => void;
  loadMessages: (chatId: string, cursor?: string) => Promise<void>;
  selectChat: (chatId: string) => void;
  createNewChat: () => void;
  loadChats: () => Promise<void>;
  clearError: () => void;
  exportChat: (format: 'json' | 'csv') => Promise<void>;
  saveDraft: (chatId: string, content: string) => void;
  getDraft: (chatId: string) => string;
  deleteChat: (chatId: string) => Promise<void>;
}

const initialState: ChatState = {
  currentChatId: null,
  chats: [],
  messages: {},
  draftMessages: {},
  isLoadingMessages: false,
  isLoadingChats: false,
  isSendingMessage: false,
  isSwitchingChat: false,
  isAITyping: false,
  isAIThinking: false,
  isCreatingChat: false,
  isExporting: false,
  isDeletingChat: false,
  hasMoreMessages: {},
  nextCursor: null,
  error: null,
  typingMessage: null,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<ChatState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear typing animation
  const clearTypingAnimation = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  }, []);

  // Load for user
  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;

    setState(prev => ({ ...prev, isLoadingChats: true, error: null }));

    try {
      const chats = await mockApi.chat.getChats();
      setState(prev => ({
        ...prev,
        chats,
        isLoadingChats: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingChats: false,
        error: error instanceof Error ? error.message : 'Failed to load chats',
      }));
    }
  }, [isAuthenticated]);

  // Load messages for a specific chat
  const loadMessages = useCallback(async (chatId: string, cursor?: string) => {
    setState(prev => ({ ...prev, isLoadingMessages: true, error: null }));

    try {
      const response = await mockApi.chat.getMessages(chatId, cursor);

      setState(prev => {
        const existingMessages = prev.messages[chatId] || [];
        const newMessages = cursor
          ? [...existingMessages, ...response.messages]
          : response.messages;

        return {
          ...prev,
          messages: {
            ...prev.messages,
            [chatId]: newMessages,
          },
          hasMoreMessages: {
            ...prev.hasMoreMessages,
            [chatId]: response.hasMore,
          },
          isLoadingMessages: false,
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingMessages: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      }));
    }
  }, []);

  // Select a chat
  const selectChat = useCallback((chatId: string) => {
    clearTypingAnimation();

    // Cancel any pending request for the chat you are on whan a new chat is chosen
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear previous chat's messages and load fresh
    setState(prev => ({
      ...prev,
      currentChatId: chatId,
      typingMessage: null,
      isSendingMessage: false,
      messages: {
        ...prev.messages,
        [chatId]: [], // UX OPTIMIZATION: Clear existing messages for optimizstic experience
      },
      hasMoreMessages: {
        ...prev.hasMoreMessages,
        [chatId]: true,
      },
      draftMessages: {
        ...prev.draftMessages,
        [chatId]: prev.draftMessages[chatId] || '', // Ensure draft exists for this chat
      },
    }));

    // Always load messages fresh when switching chats
    loadMessages(chatId);
  }, [loadMessages, clearTypingAnimation]);

  // Create new chat
  const createNewChat = useCallback(() => {
    clearTypingAnimation();

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const newChatId = `new-chat-${Date.now()}`;
    setState(prev => ({
      ...prev,
      currentChatId: newChatId,
      messages: {
        ...prev.messages,
        [newChatId]: [],
      },
      draftMessages: {
        ...prev.draftMessages,
        [newChatId]: '', // Initialize draft for new chat
      },
      typingMessage: null,
      isSendingMessage: false, // Reset sending state when creating new chat
    }));
  }, [clearTypingAnimation]);

  // Typing animation effect
  const startTypingAnimation = useCallback((fullMessage: string, messageId: string) => {
    let currentIndex = 0;
    const chars = fullMessage.split('');

    clearTypingAnimation();

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < chars.length) {
        const partialMessage = chars.slice(0, currentIndex + 1).join('');

        setState(prev => ({
          ...prev,
          typingMessage: partialMessage,
        }));

        currentIndex++;
      } else {
        // Animation completes
        clearTypingAnimation();

        setState(prev => {
          const chatId = prev.currentChatId;
          if (!chatId) return prev;

          const messages = prev.messages[chatId] || [];
          const updatedMessages = messages.map(msg =>
            msg.id === messageId
              ? { ...msg, content: fullMessage, status: 'sent' as const }
              : msg
          );

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [chatId]: updatedMessages,
            },
            typingMessage: null,
            isSendingMessage: false,
          };
        });
      }
    }, 30); // Typing speed: 30ms per character
  }, [clearTypingAnimation]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    let chatId = state.currentChatId;
    if (!user) return;

    // If no chat is selected, create a new one
    if (!chatId) {
      chatId = `new-chat-${Date.now()}`;
      setState(prev => ({
        ...prev,
        currentChatId: chatId,
        messages: {
          ...prev.messages,
          [chatId!]: [],
        },
      }));
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // UX OPTIMIZATION: Add user message immediately (optimistic resopnse)
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    // UX OPTIMIZATION: Add a placeholder AI message with 'thinking' status immediately
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      chatId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'thinking',
    };

    setState(prev => ({
      ...prev,
      isSendingMessage: true,
      error: null,
      messages: {
        ...prev.messages,
        [chatId]: [...(prev.messages[chatId] || []), userMessage, thinkingMessage],
      },
      draftMessages: {
        ...prev.draftMessages,
        [chatId]: '', // Clear draft when message is sent
      },
    }));

    try {
      let actualChatId = chatId;

      // Create chat if it's a new one
      if (chatId.startsWith('new-chat-')) {
        const newChat = await mockApi.chat.createChat(content);
        actualChatId = newChat.id;

        // Move messages from temp chat ID to actual chat ID
        setState(prev => {
          const tempMessages = prev.messages[chatId] || [];
          const newMessages = { ...prev.messages };
          delete newMessages[chatId];
          newMessages[actualChatId] = tempMessages.map(msg => ({
            ...msg,
            chatId: actualChatId
          }));

          return {
            ...prev,
            currentChatId: actualChatId,
            chats: [newChat, ...prev.chats],
            messages: newMessages,
          };
        });
      }

      // Get AI response with abort signal
      const controller = abortControllerRef.current;
      const aiResponse = await mockApi.chat.sendMessage(actualChatId, content, controller?.signal);

      // Check if request was aborted
      if (controller?.signal.aborted) {
        // Request was cancelled during thinking stage, don't process the response
        return;
      }

      // if it is interrupted while typing, Replace thinking message with partially typed message
      const aiMessageWithTyping: Message = {
        ...aiResponse,
        chatId: actualChatId,
        status: 'typing',
      };

      setState(prev => {
        const currentMessages = prev.messages[actualChatId] || [];
        // Remove the thinking message and add the partially typed message
        const filteredMessages = currentMessages.filter(msg => msg.status !== 'thinking');

        return {
          ...prev,
          messages: {
            ...prev.messages,
            [actualChatId]: [...filteredMessages, aiMessageWithTyping],
          },
        };
      });

      // Start typing animation
      startTypingAnimation(aiResponse.content, aiResponse.id);

    } catch (error) {
      const errorChatId = state.currentChatId || chatId;

      if ((error as Error).name === 'AbortError') {
        // Request was cancelled so remove thinking message
        setState(prev => {
          const currentMessages = prev.messages[errorChatId] || [];
          const filteredMessages = currentMessages.filter(msg => msg.status !== 'thinking');

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [errorChatId]: filteredMessages,
            },
            isSendingMessage: false,
          };
        });
      } else {
        // Error occurred so remove thinking message
        setState(prev => {
          const currentMessages = prev.messages[errorChatId] || [];
          const filteredMessages = currentMessages.filter(msg => msg.status !== 'thinking');

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [errorChatId]: filteredMessages,
            },
            isSendingMessage: false,
            error: error instanceof Error ? error.message : 'Failed to send message',
          };
        });
      }
    }
  }, [state.currentChatId, user, startTypingAnimation]);

  // Cancel message - handles both thinking cancellation and typing interruption
  // newContent is provided when interrupting with a new message
  const cancelMessage = useCallback((isInterruption: boolean, newContent?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    clearTypingAnimation();

    const chatId = state.currentChatId;
    if (!chatId) return;

    setState(prev => {
      const messages = prev.messages[chatId] || [];
      const lastMessage = messages[messages.length - 1];
      const secondLastMessage = messages[messages.length - 2];

      // Check if AI is typing or thinking
      const isTyping = lastMessage?.status === 'typing' && prev.typingMessage;
      const isThinking = lastMessage?.status === 'thinking';

      if (isInterruption && newContent) {
        // User is interrupting with a new message - prepare bundled request
        if (isTyping) {
          // UX OPTIMIZATION: AI was typing - save the partial message with dash appended at end to indicate abrupt stop
          const interruptedContent = prev.typingMessage ? `${prev.typingMessage}—` : '';
          const updatedMessages = messages.map(msg =>
            msg.status === 'typing'
              ? { ...msg, content: interruptedContent, status: 'interrupted' as const, wasInterrupted: true }
              : msg
          );

          // Send cancel request with partial message to backend
          if (prev.typingMessage) {
            mockApi.chat.updateMessage(chatId, lastMessage.id, 'interrupted', interruptedContent).catch(console.error);
          }

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [chatId]: updatedMessages,
            },
            isSendingMessage: false,
            typingMessage: null,
          };
        } else if (isThinking) {
          // AI was thinking - replace thinking message with interrupted notice (no dash)
          const updatedMessages = messages.map(msg =>
            msg.status === 'thinking'
              ? { ...msg, content: '', status: 'interrupted' as const, wasInterrupted: true, role: 'assistant' as const }
              : msg
          );

          // Send cancel request to backend
          if (secondLastMessage?.role === 'user') {
            mockApi.chat.updateMessage(chatId, lastMessage.id, 'cancelled', '').catch(console.error);
          }

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [chatId]: updatedMessages,
            },
            isSendingMessage: false,
            typingMessage: null,
          };
        }
      } else {
        // User is canceling the request entirely
        if (isTyping) {
          // AI was typing - save the partial message with dash
          const interruptedContent = prev.typingMessage ? `${prev.typingMessage}—` : '';
          const updatedMessages = messages.map(msg =>
            msg.status === 'typing'
              ? { ...msg, content: interruptedContent, status: 'interrupted' as const, wasInterrupted: true }
              : msg
          );

          // Send cancel request with partial message to backend
          if (prev.typingMessage) {
            mockApi.chat.updateMessage(chatId, lastMessage.id, 'interrupted', interruptedContent).catch(console.error);
          }

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [chatId]: updatedMessages,
            },
            isSendingMessage: false,
            typingMessage: null,
          };
        } else if (isThinking) {
          // AI was thinking - replace thinking message with interrupted notice (no dash)
          const updatedMessages = messages.map(msg =>
            msg.status === 'thinking'
              ? { ...msg, content: '', status: 'interrupted' as const, wasInterrupted: true, role: 'assistant' as const }
              : msg
          );

          // Send cancel request to backend
          if (secondLastMessage?.role === 'user') {
            mockApi.chat.updateMessage(chatId, lastMessage.id, 'cancelled', '').catch(console.error);
          }

          return {
            ...prev,
            messages: {
              ...prev.messages,
              [chatId]: updatedMessages,
            },
            isSendingMessage: false,
            typingMessage: null,
          };
        }
      }

      // No active message to cancel
      return {
        ...prev,
        isSendingMessage: false,
        typingMessage: null,
      };
    });
  }, [state.currentChatId, state.typingMessage, clearTypingAnimation]);

  // Export chat
  const exportChat = useCallback(async (format: 'json' | 'csv') => {
    const chatId = state.currentChatId;
    if (!chatId) return;

    try {
      const blob = await mockApi.chat.exportChat(chatId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-${chatId}-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export chat',
      }));
    }
  }, [state.currentChatId]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Save draft message for a chat
  const saveDraft = useCallback((chatId: string, content: string) => {
    if (!chatId) return;

    setState(prev => ({
      ...prev,
      draftMessages: {
        ...prev.draftMessages,
        [chatId]: content || '',
      },
    }));
  }, []);

  // Get draft message for a chat, happens when clicking on a differnt chat
  const getDraft = useCallback((chatId: string) => {
    if (!chatId) return '';
    return state.draftMessages[chatId] || '';
  }, [state.draftMessages]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string) => {
    setState(prev => ({ ...prev, isDeletingChat: true, error: null }));

    // Cancel any pending operations
    if (state.currentChatId === chatId && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      clearTypingAnimation();
    }

    try {
      // Call api to simulate delet
      const result = await mockApi.chat.deleteChat(chatId);

      if (result.success) {
        setState(prev => {
          // Filter out the deleted chat from the current state (not from API result)
          const remainingChats = prev.chats.filter(chat => chat.id !== chatId);

          // Clear messages for deleted chat
          const newMessages = { ...prev.messages };
          delete newMessages[chatId];

          // Clear draft for deleted chat
          const newDrafts = { ...prev.draftMessages };
          delete newDrafts[chatId];

          // Clear hasMoreMessages for deleted chat
          const newHasMoreMessages = { ...prev.hasMoreMessages };
          delete newHasMoreMessages[chatId];

          return {
            ...prev,
            chats: remainingChats,
            messages: newMessages,
            draftMessages: newDrafts,
            hasMoreMessages: newHasMoreMessages,
            currentChatId: prev.currentChatId === chatId ? null : prev.currentChatId,
            isDeletingChat: false,
            error: null,
          };
        });

        // If deleted chat was current, create a new one
        if (state.currentChatId === chatId) {
          createNewChat();
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isDeletingChat: false,
        error: error instanceof Error ? error.message : 'Failed to delete chat',
      }));
      throw error;
    }
  }, [state.currentChatId, createNewChat, clearTypingAnimation]);

  // Load chats on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated, loadChats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTypingAnimation();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearTypingAnimation]);

  const contextValue: ChatContextType = {
    ...state,
    sendMessage,
    cancelMessage,
    loadMessages,
    selectChat,
    createNewChat,
    loadChats,
    clearError,
    exportChat,
    saveDraft,
    getDraft,
    deleteChat,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
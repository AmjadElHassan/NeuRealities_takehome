import type { User, AuthTokens } from '../types/auth.types';
import type { Chat, Message } from '../types/chat.types';

// Mock delay to simulate network latency + it has abort support
const mockDelay = (ms: number = 800, signal?: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    // If signal is already aborted, reject immediately
    if (signal?.aborted) {
      clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    // Listening for abort signal
    signal?.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};

// Generate random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock user data
const mockUser: User = {
  id: 'user-001',
  username: 'demo_user',
  email: 'demo@example.com',
  name: 'Demo User',
};

// Demo response that will always be returned
const DEMO_RESPONSE = "This is a demo, so I will simply repeat this sentence about, idk like 1 more times, so you can see how the typing functionality is for the user to experience for a paragraph's long response.";

// Mock chat history
const mockChats: Chat[] = [
  {
    id: 'chat-001',
    userId: 'user-001',
    title: 'General Health Questions',
    lastMessage: 'Thank you for the information about vitamins.',
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    messageCount: 42,
  },
  {
    id: 'chat-002',
    userId: 'user-001',
    title: 'Nutrition and Diet',
    lastMessage: 'What are good sources of protein?',
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    messageCount: 28,
  },
  {
    id: 'chat-003',
    userId: 'user-001',
    title: 'Exercise and Fitness',
    lastMessage: 'How often should I exercise?',
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    messageCount: 15,
  },
];

// random mock messages
const generateMockMessages = (chatId: string, count: number = 30): Message[] => {
  const messages: Message[] = [];
  const baseTime = Date.now() - (count * 300000); // Start from count * 5 minutes ago

  const userQuestions = [
    "What are the symptoms of the common cold?",
    "How can I improve my sleep quality?",
    "What foods are good for heart health?",
    "How much water should I drink daily?",
    "What are the benefits of regular exercise?",
    "How can I manage stress effectively?",
    "What vitamins are essential for immune health?",
    "How often should I get health checkups?",
    "What are signs of dehydration?",
    "How can I improve my posture?",
    "What causes headaches?",
    "How can I boost my energy levels naturally?",
    "What are healthy snack options?",
    "How important is stretching before exercise?",
    "What are the risks of a sedentary lifestyle?",
  ];

  for (let i = 0; i < count; i++) {
    const isUser = i % 2 === 0;
    messages.push({
      id: `msg-${chatId}-${i}`,
      chatId,
      role: isUser ? 'user' : 'assistant',
      content: isUser
        ? userQuestions[(i / 2) % userQuestions.length]
        : DEMO_RESPONSE,
      timestamp: new Date(baseTime + (i * 300000)).toISOString(),
      status: 'sent',
    });
  }

  return messages.reverse(); // Most recent messages first
};

export const mockApi = {
  auth: {
    login: async (username: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
      await mockDelay(1000);

      // Simple mock validation (case-insensitive username, case-sensitive password)
      if (username.toLowerCase() === 'demo' && password === 'demo123') {
        return {
          user: mockUser,
          tokens: {
            accessToken: 'mock-jwt-token-' + generateId(),
            refreshToken: 'mock-refresh-token-' + generateId(),
            expiresIn: 43200, // 12 hours in seconds
          },
        };
      }

      throw new Error('Invalid credentials. Try username: demo, password: demo123');
    },

    logout: async (): Promise<void> => {
      await mockDelay(500);
      return;
    },
  },

  chat: {
    getChats: async (): Promise<Chat[]> => {
      await mockDelay(800);
      return mockChats;
    },

    getMessages: async (chatId: string, cursor?: string, limit: number = 10): Promise<{
      messages: Message[];
      hasMore: boolean;
      nextCursor?: string;
    }> => {
      await mockDelay(600);

      // Generate 30 messages for each chat
      const allMessages = generateMockMessages(chatId, 30);

      // Parse cursor (it represents the number of messages already loaded)
      const startIndex = cursor ? parseInt(cursor, 10) : 0;
      const endIndex = Math.min(startIndex + limit, allMessages.length);

      // Get the slice of messages (most recent first)
      const messages = allMessages.slice(startIndex, endIndex);

      return {
        messages,
        hasMore: endIndex < allMessages.length,
        nextCursor: endIndex < allMessages.length ? endIndex.toString() : undefined,
      };
    },

    sendMessage: async (chatId: string, _content: string, signal?: AbortSignal): Promise<Message> => {
      // Simulate typing delay with abort support
      await mockDelay(2000 + Math.random() * 2000, signal);

      // Generate AI response with the demo message repeated 2 times
      const responseContent = `${DEMO_RESPONSE} ${DEMO_RESPONSE}`;

      const aiResponse: Message = {
        id: 'msg-' + generateId(),
        chatId,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      return aiResponse;
    },

    createChat: async (firstMessage: string): Promise<Chat> => {
      await mockDelay(500);

      const newChat: Chat = {
        id: 'chat-' + generateId(),
        userId: mockUser.id,
        title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
        lastMessage: firstMessage,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        messageCount: 1,
      };

      return newChat;
    },

    // Update AI message (for interruptions/cancellations)
    updateMessage: async (
      chatId: string,
      messageId: string,
      status: 'interrupted' | 'cancelled',
      finalContent?: string
    ): Promise<void> => {
      await mockDelay(200);
      if (status === 'interrupted' && finalContent) {
        console.log(`Updated interrupted message ${messageId} in chat ${chatId}: "${finalContent}"`);
      } else if (status === 'cancelled') {
        console.log(`Marked message ${messageId} as cancelled in chat ${chatId}`);
      }
      return;
    },

    // Process bundled message request (interruption + new message)
    processBundledMessage: async (
      chatId: string,
      updates: Array<{
        type: 'ai_update' | 'user_message';
        messageId?: string;
        status?: 'interrupted' | 'cancelled';
        finalContent?: string;
        content?: string;
      }>,
      signal?: AbortSignal
    ): Promise<Message | null> => {
      for (const update of updates) {
        if (update.type === 'ai_update' && update.messageId) {
          // Update the AI message
          await mockApi.chat.updateMessage(
            chatId,
            update.messageId,
            update.status!,
            update.finalContent
          );
        }
      }

      // Find the user message in the bundle
      const userMessage = updates.find(u => u.type === 'user_message');
      if (userMessage && userMessage.content) {
        // Generate AI response for the new user message
        return mockApi.chat.sendMessage(chatId, userMessage.content, signal);
      }

      return null;
    },

    deleteChat: async (chatId: string): Promise<{ success: boolean; remainingChats: Chat[] }> => {
      await mockDelay(800); // Reduced delay for better UX

      // Filter out the deleted chat and return remaining chats
      const remainingChats = mockChats.filter(chat => chat.id !== chatId);

      // Update the mock data (in real app, this would be server-side)
      mockChats.length = 0;
      mockChats.push(...remainingChats);

      return {
        success: true,
        remainingChats
      };
    },

    exportChat: async (chatId: string, format: 'json' | 'csv'): Promise<Blob> => {
      await mockDelay(1000);

      const messages = generateMockMessages(chatId, 50);

      if (format === 'json') {
        const data = {
          chatId,
          exportedAt: new Date().toISOString(),
          disclaimer: 'This chat history is for educational purposes only and should not be considered medical advice.',
          messages,
        };
        //JSON
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      } else {
        // CSV 
        const headers = 'Timestamp,Role,Message\n';
        const rows = messages.map(msg =>
          `"${msg.timestamp}","${msg.role}","${msg.content.replace(/"/g, '""')}"`
        ).join('\n');
        const disclaimer = '"DISCLAIMER","","This chat history is for educational purposes only and should not be considered medical advice."\n';

        return new Blob([disclaimer + headers + rows], { type: 'text/csv' });
      }
    },
  },
};
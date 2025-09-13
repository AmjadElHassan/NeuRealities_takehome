export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'typing' | 'thinking' | 'interrupted';

export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  wasInterrupted?: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
}

export interface ChatState {
  currentChatId: string | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  draftMessages: Record<string, string>;
  isLoadingMessages: boolean;
  isLoadingChats: boolean;
  isSendingMessage: boolean;
  isSwitchingChat: boolean;
  isAITyping: boolean;
  isAIThinking: boolean;
  isCreatingChat: boolean;
  isExporting: boolean;
  isDeletingChat: boolean;
  hasMoreMessages: Record<string, boolean>;
  nextCursor: string | null;
  error: string | null;
  typingMessage: string | null;
}
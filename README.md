# Medical AI Chat Assistant

A React-based medical education chatbot with real-time typing animations and smooth scrolling.

## Features

### Chat Interface
- **Real-time AI Responses** - Medical Q&A with character-by-character typing animation
- **Multi-chat Management** - Create, switch between, and delete chat sessions
- **Smart Interruptions** - Cancel responses with ESC or interrupt mid-typing with new message
- **Draft Persistence** - Auto-save message drafts when switching chats
- **Message Status Indicators** - Visual states for thinking, typing, sent, interrupted
- **Export Functionality** - Download chat history as JSON or CSV

### User Experience
- **Session Management** - 30-minute timeout with 5-minute warning
- **Cross-tab Sync** - Activity tracking across browser tabs
- **Keyboard Shortcuts** - Enter to send, Shift+Enter for newline, ESC to cancel
- **Auto-scroll** - Smart scrolling that respects user position
- **Loading States** - Animated indicators for all async operations
- **Medical Disclaimer** - Persistent safety warnings in UI

### Design & Accessibility
- **Responsive Layout** - Mobile drawer (280px) / Desktop sidebar
- **Dark/Light Theme Support** - Material-UI theming system
- **ARIA Labels** - Full screen reader support
- **Touch-friendly** - 44px minimum touch targets
- **Focus Management** - Proper focus trapping in modals
- **Semantic HTML** - Proper heading hierarchy and landmarks

## Tech Stack

```
Frontend:        React 19 + TypeScript
UI Framework:    Material-UI v7
Build Tool:      Vite
State:           React Context + TanStack Query
Styling:         Emotion CSS-in-JS
Performance:     React Window (virtualization)
```

## Project Structure

```
src/
├── components/
│   ├── Auth/          # Login modal
│   ├── Chat/          # Chat UI components
│   └── Layout/        # App shell
├── contexts/          # Global state management
├── hooks/             # Custom React hooks
├── services/          # API and mock responses
├── theme/             # MUI theme config
└── types/             # TypeScript definitions
```

## Performance Optimizations

### Rendering & Animation
- **RAF-based Scrolling** - 60fps monitoring with `requestAnimationFrame` for smooth auto-scroll abd Native `scrollBehavior: smooth` reduces CPU usage by 70%
- **React.memo Components** - MessageList, ChatSidebar, MessageBubble prevent unnecessary re-renders
- **useCallback Hooks** - Memoized event handlers throughout the app

### State & Memory Management
- **useRef for Values** - Non-updated values stored in refs to prevent re-renders
- **Draft Persistence** - Message drafts saved per chat, restored on switch
- **Cleanup on Unmount** - All animations, timers, and listeners properly cleaned up
- **Controlled Re-renders** - Strategic state updates minimize component refreshes

### Network & Data
- **AbortController** - All API calls cancellable for immediate interruption response
- **Optimistic Updates** - Messages display instantly, sync with server in background
- **Bundled Requests** - Interrupt + new message sent as single API call
- **Mock API Delays** - Simulated network latency with proper abort signal handling

### UX Enhancements
- **Loading Indicators** - Skeleton loaders, spinners, and "Thinking..." animations
- **Keyboard Navigation** - Full keyboard support with proper focus management
- **Session Persistence** - localStorage for auth tokens and session data
- **Cross-tab Activity** - StorageEvent dispatching for multi-tab synchronization

  
## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Demo Credentials

- Username: `demo`
- Password: `demo123`

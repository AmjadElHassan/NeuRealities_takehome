import React, { useState } from 'react';
import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Chat } from '@mui/icons-material';
import { ChatProvider } from '../../contexts/ChatContext';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';

interface ChatContainerProps {
  isAuthenticated: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ isAuthenticated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  if (!isAuthenticated) {
    // Show empty box and message if id is not authenticated
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            maxWidth: '25rem',
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '5rem',
              height: '5rem',
              borderRadius: '50%',
              bgcolor: 'primary.light',
              mb: 3,
            }}
          >
            <Chat sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" gutterBottom fontWeight={500}>
            Welcome to Medical AI Chat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please sign in to start your medical education journey
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <ChatProvider>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          bgcolor: 'background.default',
        }}
      >
        <ChatSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />

        <ChatWindow onToggleSidebar={handleToggleSidebar} />
      </Box>
    </ChatProvider>
  );
};
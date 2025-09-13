import { memo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Toolbar,
  AppBar,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  HealthAndSafety,
  Logout,
  AccountCircle,
} from '@mui/icons-material';
import { MessageList } from './MessageList';
import { ChatInputArea } from './InputArea';
import { MedicalDisclaimer } from '../Common/MedicalDisclaimer';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
  onToggleSidebar: () => void;
}

export const ChatWindow = memo<ChatWindowProps>(({ onToggleSidebar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentChatId, messages, chats } = useChat();
  const { user, logout } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const currentMessages = currentChatId ? messages[currentChatId] || [] : [];
  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Handle opening the user account menu
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
        pt: isMobile ? '56px' : 0, // Account for fixed header on mobile
        pb: isMobile ? '80px' : 0, // Account for fixed input on mobile
      }}
    >
      {/* Header: title, sidebar toggler, user account bubble */}
      <AppBar
        position={isMobile ? "fixed" : "static"}
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          top: 0,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            aria-label="toggle sidebar"
            onClick={onToggleSidebar}
            sx={{
              mr: 2,
              display: { xs: 'inline-flex', sm: 'inline-flex' },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
            <HealthAndSafety sx={{
              mr: 1,
              color: 'primary.main',
              display: { xs: 'none', sm: 'block' },
              flexShrink: 0
            }} />
            <Typography
              variant="h6"
              color="text.primary"
              noWrap
              sx={{
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              {currentChat ? currentChat.title : 'Medical AI Assistant'}
            </Typography>
          </Box>

          {user && (
            <>
              {isMobile ? (
                <IconButton
                  onClick={handleUserMenuOpen}
                  aria-label="User menu"
                  sx={{
                    color: 'text.primary',
                  }}
                >
                  <AccountCircle sx={{ fontSize: '2rem' }} />
                </IconButton>
              ) : (
                <Button
                  onClick={handleUserMenuOpen}
                  aria-label="User menu"
                  startIcon={<AccountCircle />}
                  sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    minWidth: '9.375rem',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Typography variant="body2">
                    {user.name || user.username}
                  </Typography>
                </Button>
              )}

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {user.name || user.username}
                  </Typography>
                  {user.email && (
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  )}
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Medical Disclaimer again*/}
      {!isMobile && (
        <Box sx={{ p: 2, pb: 0 }}>
          <MedicalDisclaimer variant="compact" />
        </Box>
      )}

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {currentChatId ? (
          <MessageList messages={currentMessages} />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                maxWidth: '25rem',
                borderRadius: 3,
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  mb: 2,
                }}
              >
                <HealthAndSafety sx={{ fontSize: '2rem', color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                Welcome to Medical AI Chat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a new chat to ask medical questions or select a previous conversation from the sidebar.
              </Typography>
              {isMobile && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Tap the menu icon to view your chat history.
                </Typography>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* Input Area */}
      <ChatInputArea disabled={false} />
    </Box>
  );
});

ChatWindow.displayName = 'ChatWindow';
import React, { memo, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Button,
  Divider,
  Drawer,
  Menu,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add,
  ChatBubble,
  Download,
  Close,
  Delete,
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { useChat } from '../../contexts/ChatContext';
import type { Chat } from '../../types/chat.types';

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export const ChatSidebar = memo<ChatSidebarProps>(({ open, onClose, isMobile }) => {
  const {
    chats,
    currentChatId,
    messages,
    selectChat,
    createNewChat,
    exportChat,
    deleteChat,
    isLoadingChats,
    isSendingMessage,
    isDeletingChat,
  } = useChat();

  const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);
  const [isLoadingChatList, setIsLoadingChatList] = React.useState(false);

  // states for the delete function
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // reload the sidebar on a new request
  React.useEffect(() => {
    if (isSendingMessage) {
      setIsLoadingChatList(true);
      const timer = setTimeout(() => {
        setIsLoadingChatList(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isSendingMessage]);

  // Trigger sidebar reload when switching chats
  React.useEffect(() => {
    if (isCreatingChat) {
      const timer = setTimeout(() => {
        setIsCreatingChat(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCreatingChat]);

  const handleCreateNewChat = () => {
    setIsCreatingChat(true);
    setIsLoadingChatList(true);
    createNewChat();
    setTimeout(() => {
      setIsLoadingChatList(false);
    }, 500);
  };

  const handleSelectChat = (chatId: string) => {
    setIsLoadingChatList(true);
    selectChat(chatId);
    setTimeout(() => {
      setIsLoadingChatList(false);
    }, 500);
    //close the sidebar if were on a mobile device
    if (isMobile) {
      onClose();
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    handleExportClose();
    await exportChat(format);
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLElement>, chat: Chat) => {
    event.stopPropagation();
    event.preventDefault();
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;

    try {
      await deleteChat(chatToDelete.id);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
      setDeleteError(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete chat. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
    setDeleteError(null);
  };

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const currentChatMessages = currentChatId ? messages[currentChatId] : null;
  const hasMessages = currentChatMessages && currentChatMessages.length > 0;

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>
          Chat History
        </Typography>
        {isMobile && (
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close sidebar"
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* button to export chat and start new chat*/}
      <Box sx={{ p: 2 }}>
        {isCreatingChat ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateNewChat}
              sx={{ borderRadius: 20 }}
            >
              New Chat
            </Button>

            {/* export feature, the button is diasabled when a chat has no messages */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportClick}
              disabled={!hasMessages}
              sx={{ borderRadius: 20, bgcolor: 'secondary.main' }}
            >
              Export Chat
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportClose}
            >
              <MenuItem onClick={() => handleExport('json')}>Export as JSON</MenuItem>
              <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Chat history area */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoadingChatList || isLoadingChats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : chats.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 4 }}
            >
              No chats yet. Start a new conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 1 }}>
            {chats.map((chat) => (
              <ListItem
                key={chat.id}
                disablePadding
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  position: 'relative',
                  bgcolor: chat.id === currentChatId ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: chat.id === currentChatId ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <ListItemButton
                  onClick={() => handleSelectChat(chat.id)}
                  selected={chat.id === currentChatId}
                  sx={{
                    pr: 7,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'transparent',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    <ChatBubble
                      sx={{
                        fontSize: '1.25rem',
                        color:
                          chat.id === currentChatId
                            ? 'primary.main'
                            : 'text.secondary',
                      }}
                    />
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight:
                            chat.id === currentChatId ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chat.title}
                      </Typography>
                    }
                    secondary={
                      <Box
                        component="span"
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            mr: 1,
                          }}
                        >
                          {chat.lastMessage}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ flexShrink: 0 }}
                        >
                          {formatChatDate(chat.lastMessageAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
                <IconButton
                  aria-label="delete chat"
                  onClick={(e) => handleDeleteClick(e, chat)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'text.secondary',
                    opacity: 0.5,
                    transition: 'opacity 0.2s, color 0.2s',
                    '&:hover': {
                      opacity: 1,
                      color: 'text.primary',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Delete sx={{ fontSize: '1.125rem' }} />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Delete Dialog when a chat trash icon is clicked */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title">
          Delete Chat?
        </DialogTitle>
        <DialogContent>
          {isDeletingChat ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <DialogContentText id="delete-dialog-description">
                Are you sure you want to delete "{chatToDelete?.title}"?
                This action cannot be undone and the chat data will not be retrievable.
              </DialogContentText>
              {deleteError && (
                <Box sx={{ mt: 2 }}>
                  <Typography color="error" variant="body2">
                    {deleteError}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        {!isDeletingChat && (
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="primary"
              variant="outlined"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: '17.5rem',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: open ? '17.5rem' : 0,
        borderRight: open ? 1 : 0,
        borderColor: 'divider',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {sidebarContent}
    </Box>
  );
});

ChatSidebar.displayName = 'ChatSidebar';
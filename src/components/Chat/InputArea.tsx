import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Tooltip,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Send, Cancel } from '@mui/icons-material';
import { useChat } from '../../contexts/ChatContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface InputAreaProps {
  disabled?: boolean;
}

export const ChatInputArea = memo<InputAreaProps>(({ disabled = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { sendMessage, cancelMessage, isSendingMessage, currentChatId, saveDraft, getDraft } = useChat();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previousChatIdRef = useRef<string | null>(null);
  const messageRef = useRef<string>('');

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    if (previousChatIdRef.current !== currentChatId) {
      if (previousChatIdRef.current && !isSendingMessage) {
        try {
          saveDraft(previousChatIdRef.current, messageRef.current);
        } catch (error) {
          console.error('Error saving draft:', error);
        }
      }

      if (currentChatId) {
        try {
          const draft = getDraft(currentChatId);
          setMessage(draft || '');
        } catch (error) {
          console.error('Error loading draft:', error);
          setMessage('');
        }
      } else {
        setMessage('');
      }

      previousChatIdRef.current = currentChatId;
    }
  }, [currentChatId, isSendingMessage]);

  useEffect(() => {
    if (currentChatId && !isSendingMessage && previousChatIdRef.current === currentChatId) {
      try {
        saveDraft(currentChatId, message);
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }
  }, [message, currentChatId, saveDraft, isSendingMessage]);

  useEffect(() => {
    if (!isSendingMessage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSendingMessage]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setMessage('');

    if (isSendingMessage) {
      cancelMessage(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await sendMessage(trimmedMessage);
    } catch {
      setMessage(trimmedMessage);
    }
  };

  const handleCancel = () => {
    cancelMessage(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useKeyboardShortcuts([
    {
      key: 'Enter',
      handler: (e) => {
        if (!e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
    },
    {
      key: 'Escape',
      handler: () => {
        if (isSendingMessage) {
          handleCancel();
        }
      },
    },
  ], !disabled);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
        bgcolor: 'background.paper',
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        left: 0,
        right: 0,
        zIndex: isMobile ? theme.zIndex.appBar - 1 : 'auto',
      }}
    >
      <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isSendingMessage
              ? 'AI is typing... You can still type your next message'
              : 'Type your medical question here...'
          }
          disabled={disabled}
          variant="outlined"
          inputProps={{
            'aria-label': 'Message input',
            'aria-describedby': 'message-helper-text',
          }}
        />

        {!isSendingMessage && (
          <Tooltip title="Send message (Enter)">
            <span>
              <IconButton
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                color="primary"
                size="large"
                aria-label="Send message"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                <Send />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {isSendingMessage && (
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            startIcon={<Cancel />}
            aria-label="Cancel sending message"
          >
            Cancel
          </Button>
        )}
      </Box>
    </Paper>
  );
});

ChatInputArea.displayName = 'InputArea';
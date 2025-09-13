import { memo } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';
import type { Message } from '../../types/chat.types';
import { format } from 'date-fns';
import { useTypingAnimation } from '../../hooks/useTypingAnimation';

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
}

export const MessageBubble = memo<MessageBubbleProps>(({ message, isTyping = false }) => {
  //first lets check the role for the message. it shoudl either be user or assistant
  const isUser = message.role === 'user';
  //UX OPTIMIZATION: if it is the assistant, then its response should simulate typing out
  const { displayedText, isAnimating } = useTypingAnimation(
    message.content,
    isTyping && !isUser,
    {
      speed: 25,
    }
  );

  const displayContent = isTyping && !isUser ? displayedText : message.content;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: '70%',
          gap: '0.5rem',
        }}
      >
        {/* Avatar for user or assistant */}
        <Box
          sx={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.5,
          }}
          aria-hidden="true"
        >
          {isUser ? (
            <Person sx={{ fontSize: '1.25rem', color: 'white' }} />
          ) : (
            <SmartToy sx={{ fontSize: '1.25rem', color: 'white' }} />
          )}
        </Box>

        {/* Content of the message */}
        <Box sx={{ flex: 1 }}>
          {(displayContent || message.status === 'sending') && (
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: isUser ? 'primary.light' : 'background.paper',
                color: isUser ? 'primary.contrastText' : 'text.primary',
                borderTopLeftRadius: isUser ? 16 : 4,
                borderTopRightRadius: isUser ? 4 : 16,
                position: 'relative',
                minHeight: isAnimating ? '3.125rem' : 'auto',
                transition: 'min-height 0.3s ease',
              }}
            >
              {/* UX OPTIMIZATION: Loading indicator for when the message is mid-send */}
              {message.status === 'sending' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CircularProgress size={16} sx={{ color: 'inherit' }} />
                  <Typography variant="body2">Sending...</Typography>
                </Box>
              )}

              {message.status !== 'sending' && (
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                  }}
                  role={isUser ? 'log' : 'status'}
                  aria-live={!isUser ? 'polite' : undefined}
                >
                  {displayContent}
                  {isAnimating && (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: '0.5rem',
                        height: '1.125rem',
                        bgcolor: 'currentColor',
                        ml: 0.5,
                        animation: 'blink 1s infinite',
                        '@keyframes blink': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    />
                  )}
                </Typography>
              )}
              {/* Timestamp */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  opacity: 0.7,
                  fontSize: '0.7rem',
                }}
                aria-label={`Sent at ${format(new Date(message.timestamp), 'h:mm a')}`}
              >
                {format(new Date(message.timestamp), 'h:mm a')}
              </Typography>
            </Paper>
          )}

          {/* UX OPTIMIZATION: if the user cancel's or sends new message, mid-ai response: Interruption Notice */}
          {message.wasInterrupted && !isUser && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                px: 2,
                py: 0.5,
                color: 'text.secondary',
                fontStyle: 'italic',
                fontSize: '0.75rem',
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              Response stopped • Ready for your next question
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
});

MessageBubble.displayName = 'MessageBubble';
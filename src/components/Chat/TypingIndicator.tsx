import { memo, useState, useEffect } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { SmartToy } from '@mui/icons-material';

interface TypingIndicatorProps {
  visible: boolean;
}

export const TypingIndicator = memo<TypingIndicatorProps>(({ visible }) => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;
  ///make an ellipses from . to ... typing repeat for however long it loads
  const dots = '.'.repeat(dotCount);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        mb: 2,
        px: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          maxWidth: '70%',
          gap: '0.5rem',
        }}
      >
        {/* AI Avatar */}
        <Box
          sx={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.5,
          }}
          aria-hidden="true"
        >
          <SmartToy sx={{ fontSize: '1.25rem', color: 'white' }} />
        </Box>

        {/* Typing Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            minWidth: '6.25rem',
          }}
          role="status"
          aria-live="polite"
          aria-label="AI is thinking"
        >
          <Typography variant="body2" color="text.secondary">
            Thinking{dots}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
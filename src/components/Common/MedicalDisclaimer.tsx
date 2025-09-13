import React from 'react';
import { Alert, AlertTitle, Typography, Box } from '@mui/material';
import { Warning } from '@mui/icons-material';

interface MedicalDisclaimerProps {
  variant?: 'standard' | 'compact';
  severity?: 'warning' | 'info';
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({
  variant = 'standard',
  severity = 'warning',
}) => {
  if (variant === 'compact') {
    return (
      <Alert
        severity={severity}
        icon={<Warning />}
        sx={{
          borderRadius: 2,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Typography variant="body2">
          For educational purposes only. Not medical advice.
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert
      severity={severity}
      icon={<Warning />}
      sx={{
        borderRadius: 2,
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>Medical Disclaimer</AlertTitle>
      <Box component="div" sx={{ mt: 1 }}>
        <Typography variant="body2" paragraph>
          This AI assistant provides general health information for educational purposes only.
        </Typography>
        <Typography variant="body2" paragraph>
          The information provided should not be considered medical advice, diagnosis, or treatment recommendations.
        </Typography>
        <Typography variant="body2">
          <strong>Always consult with a qualified healthcare professional</strong> for medical advice,
          diagnosis, and treatment of any health condition.
        </Typography>
      </Box>
    </Alert>
  );
};
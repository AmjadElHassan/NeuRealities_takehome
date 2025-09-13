import React, { useState } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, HealthAndSafety } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});


  //use same function to store credential state
  const handleInputChange = (field: 'username' | 'password') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }));

    // cleare validation error on new submit
    if (field === 'username' && validationErrors.username) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
      if (error) {
        clearError();
      }
    }

    // Authentication error stay on pw intil submit again
    if (field === 'password' && validationErrors.password === 'Password is required') {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!credentials.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials);
      //reset errors on new resubmit req
      setValidationErrors({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Incorrect username or password';
      setValidationErrors(prev => ({
        ...prev,
        password: errorMessage
      }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Modal
      open={open}
      aria-labelledby="login-modal-title"
      aria-describedby="login-modal-description"
      sx={{
        display: 'flex',
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'center',
        p: { xs: 0, sm: 2 },
      }}
      disableEscapeKeyDown
      disableAutoFocus
    >
      <Fade in={open}>
        <Paper
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 440 },
            height: { xs: '100vh', sm: 'auto' },
            mx: { xs: 0, sm: 2 },
            p: { xs: 3, sm: 4 },
            borderRadius: { xs: 0, sm: 3 },
            boxShadow: { xs: 0, sm: 24 },
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center' }}>
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
              <Typography
                id="login-modal-title"
                variant="h4"
                component="h2"
                gutterBottom
                fontWeight={600}
              >
                Medical AI Assistant
              </Typography>
              <Typography
                id="login-modal-description"
                variant="body2"
                color="text.secondary"
              >
                Sign in to access your medical education chatbot
              </Typography>
            </Box>


            {/* display Demo username and pw */}
            <Alert
              severity="info"
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2">
                <strong>Demo Credentials:</strong><br />
                Username: demo<br />
                Password: demo123
              </Typography>
            </Alert>

            <TextField
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={credentials.username}
              onChange={handleInputChange('username')}
              error={!!validationErrors.username}
              helperText={validationErrors.username}
              disabled={isLoading}
              slotProps={{
                htmlInput: {
                  'aria-label': 'Username',
                  'aria-required': true,
                  'aria-invalid': !!validationErrors.username,
                  'aria-describedby': validationErrors.username ? 'username-error' : undefined,
                },
              }}
            />

            <TextField
              required
              fullWidth
              id="password"
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              disabled={isLoading}
              sx={{
                '& input[type="password"]::-ms-reveal': {
                  display: 'none',
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  'aria-label': 'Password',
                  'aria-required': true,
                  'aria-invalid': !!validationErrors.password,
                  'aria-describedby': validationErrors.password ? 'password-error' : undefined,
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                position: 'relative',
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      marginLeft: '-0.75rem',
                    }}
                  />
                  <span style={{ visibility: 'hidden' }}>Sign In</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* medical disclaimer part */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                mt: 2,
                px: 2,
                lineHeight: 1.5,
              }}
            >
              This application provides educational health information only.
              It is not a substitute for professional medical advice, diagnosis, or treatment.
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Modal>
  );
};
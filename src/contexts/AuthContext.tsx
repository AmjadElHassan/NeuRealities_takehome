import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AuthContextType, AuthState, LoginCredentials, User } from '../types/auth.types';
import { storage } from '../utils/storage';
import { mockApi } from '../services/mockResponses';

const INACTIVITY_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes before timeout

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  sessionExpiresAt: null,
  lastActivityAt: Date.now(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  onSessionWarning?: () => void;
  onSessionExpired?: () => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onSessionWarning,
  onSessionExpired,
}) => {
  const [state, setState] = useState<AuthState>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const activityListenerRef = useRef<boolean>(false);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  // Handle logout
  const logout = useCallback(() => {
    clearTimeouts();
    storage.clearAuthData();
    setState({
      ...initialState,
      isLoading: false,
    });

    // demo so we call mock logout API
    mockApi.auth.logout().catch(console.error);

    // Call session expired callback (12 hours timeout)
    if (onSessionExpired) {
      onSessionExpired();
    }
  }, [clearTimeouts, onSessionExpired]);

  // Set up session timeout
  const setupSessionTimeout = useCallback(() => {
    clearTimeouts();

    const lastActivity = storage.getLastActivity() || Date.now();
    const timeUntilTimeout = INACTIVITY_TIMEOUT - (Date.now() - lastActivity);

    if (timeUntilTimeout <= 0) {
      logout();
      return;
    }

    // UX Optimization: give use a warning to prevent session timeout if it is approaching
    if (timeUntilTimeout > WARNING_BEFORE_TIMEOUT) {
      warningRef.current = setTimeout(() => {
        if (onSessionWarning) {
          onSessionWarning();
        }
      }, timeUntilTimeout - WARNING_BEFORE_TIMEOUT);
    }

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeUntilTimeout);
  }, [clearTimeouts, logout, onSessionWarning]);

  // Update user activity
  const updateActivity = useCallback(() => {
    const now = Date.now();
    storage.setLastActivity(now);
    setState(prev => ({ ...prev, lastActivityAt: now }));

    if (state.isAuthenticated) {
      setupSessionTimeout();
    }
  }, [state.isAuthenticated, setupSessionTimeout]);

  // Handle login
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user, tokens } = await mockApi.auth.login(
        credentials.username,
        credentials.password
      );

      // Store auth data
      storage.setAuthToken(tokens.accessToken);
      storage.setUserData(user);

      const sessionExpiresAt = Date.now() + (tokens.expiresIn * 1000);
      storage.setSessionExpires(sessionExpiresAt);
      storage.setLastActivity(Date.now());

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiresAt,
        lastActivityAt: Date.now(),
      });

      setupSessionTimeout();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, [setupSessionTimeout]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Activity event listeners
  useEffect(() => {
    if (state.isAuthenticated && !activityListenerRef.current) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

      const handleActivity = () => {
        const lastActivity = storage.getLastActivity() || 0;
        const now = Date.now();

        // Only update if more than 1 minute has passed
        if (now - lastActivity > 60000) {
          updateActivity();
        }
      };

      events.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      activityListenerRef.current = true;

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
        activityListenerRef.current = false;
      };
    }
  }, [state.isAuthenticated, updateActivity]);

  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue) {
        // happens if Token was removed in another tab
        setState({
          ...initialState,
          isLoading: false,
        });
      } else if (e.key === 'last_activity' && e.newValue) {
        // happens if Activity updated in another tab
        const lastActivity = parseInt(e.newValue, 10);
        setState(prev => ({ ...prev, lastActivityAt: lastActivity }));
        if (state.isAuthenticated) {
          setupSessionTimeout();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [state.isAuthenticated, setupSessionTimeout]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = storage.getAuthToken();
      const userData = storage.getUserData<User>();
      const sessionExpires = storage.getSessionExpires();

      if (token && userData && sessionExpires && storage.isSessionValid()) {
        setState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          sessionExpiresAt: sessionExpires,
          lastActivityAt: storage.getLastActivity() || Date.now(),
        });
        setupSessionTimeout();
      } else {
        storage.clearAuthData();
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    checkSession();
  }, [setupSessionTimeout]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    updateActivity,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
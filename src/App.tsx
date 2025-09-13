import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginModal } from './components/Auth/LoginModal';
import { ChatContainer } from './components/Chat/ChatContainer';
import theme from './theme/theme';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <CssBaseline />
      {!isAuthenticated && <LoginModal open={true} />}
      <ChatContainer isAuthenticated={isAuthenticated} />
    </>
  );
}

function App() {
  const handleSessionExpired = () => {
    console.log('Session expired - user logged out');
  };

  const handleSessionWarning = () => {
    console.log('Session warning - 5 minutes until logout');
  };

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider
          onSessionExpired={handleSessionExpired}
          onSessionWarning={handleSessionWarning}
        >
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
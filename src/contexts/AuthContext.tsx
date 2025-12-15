import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-toastify';
import { User } from '../types';
import { authService, LoginCredentials, RegisterData } from '../services/auth';
import { apiService } from '../services/api';
import { SessionInfo } from '../services/sessions';
import { NotificationContext } from './NotificationContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  getSessions: () => Promise<SessionInfo[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get notifications - NotificationProvider must wrap AuthProvider in App.tsx
  // Use useContext directly to safely access the context
  const notificationContext = useContext(NotificationContext);
  const addNotification = notificationContext?.addNotification || ((notification: any) => {
    // Fallback: just use toast if NotificationProvider is not available
    console.warn('NotificationProvider not available, using toast notifications only');
  });

  const performLogout = useCallback(
    async ({ silent, skipServer }: { silent?: boolean; skipServer?: boolean } = {}) => {
      const currentUser = authService.getCurrentUser();
      try {
        if (!skipServer) {
          await authService.logout();
        }
      } catch (error) {
        console.error('Error logging out:', error);
      } finally {
        apiService.clearTokens();
        authService.clearCurrentUser();
        if (currentUser && !silent) {
          addNotification({
            title: 'Signed Out',
            message: 'You have been logged out. See you soon!',
            type: 'info',
            priority: 'low',
            userId: currentUser.id,
            category: 'system',
          });
        }
        setUser(null);
      }
    },
    [addNotification]
  );

  const logout = useCallback(async () => {
    await performLogout();
  }, [performLogout]);

  const refreshUser = useCallback(async () => {
    try {
      const status = await authService.checkStatus();
      if (status.isAuthenticated && status.user) {
        authService.setCurrentUser(status.user);
        setUser(status.user);
        return;
      }

      const refreshed = await authService.refreshToken();
      if (refreshed.success) {
        const profile = await authService.getProfile();
        authService.setCurrentUser(profile);
        setUser(profile);
        return;
      }

      await performLogout({ silent: true, skipServer: true });
    } catch (error) {
      console.error('Error refreshing user:', error);
      await performLogout({ silent: true, skipServer: true });
      throw error;
    }
  }, [performLogout]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        if (!authService.isAuthenticated()) {
          apiService.clearTokens();
          authService.clearCurrentUser();
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        const cachedUser = authService.getCurrentUser();
        if (cachedUser) {
          if (isMounted) {
            setUser(cachedUser);
          }
          return;
        }

        await refreshUser();
      } catch (error) {
        console.error('Auth initialization error:', error);
        await performLogout({ silent: true, skipServer: true });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshUser, performLogout]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        authService.setCurrentUser(response.data.user);
        setUser(response.data.user);
        // Show success toast
        const successMessage = response.message || `Welcome back, ${response.data.user.name}!`;
        toast.success(successMessage);
        // Also add to notification system
        addNotification({
          title: 'Login Successful',
          message: successMessage,
          type: 'success',
          priority: 'medium',
          userId: response.data.user.id,
          category: 'system',
        });
      } else {
        // If login was not successful, throw an error with the message from the response
        // Handle nested error object structure: { error: { message: "..." } }
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (response.message) {
          errorMessage = response.message;
        } else if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          }
        } else if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          errorMessage = response.errors[0];
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      if (response.success && response.data) {
        authService.setCurrentUser(response.data.user);
        setUser(response.data.user);
        addNotification({
          title: 'Registration Complete',
          message: response.message || 'Your account has been created successfully.',
          type: 'success',
          priority: 'medium',
          userId: response.data.user.id,
          category: 'system',
        });
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      authService.setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      await authService.verifyEmail(token);
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  };

  const resendVerification = async () => {
    try {
      await authService.resendVerification();
    } catch (error) {
      console.error('Error resending verification:', error);
      throw error;
    }
  };

  const getSessions = async () => {
    try {
      return await authService.getSessions();
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await authService.revokeSession(sessionId);
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  };

  const revokeAllSessions = async () => {
    try {
      await authService.revokeAllSessions();
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification,
    getSessions,
    revokeSession,
    revokeAllSessions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

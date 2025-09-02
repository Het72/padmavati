import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userAPI } from '../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: {
    public_id: string;
    url: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
  });

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          console.log('Token found in localStorage, checking auth status');
          const response = await userAPI.getProfile();
          const user = response.data.user;
          console.log('Profile response:', response.data);
          console.log('User role from profile:', user.role, 'isAdmin check:', user.role === 'admin');
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            isAdmin: user.role === 'admin',
          });
          
          console.log('Auth state after token validation:', {
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin'
          });
        } catch (error: any) {
          // Token is invalid or expired, remove it
          console.log('Token validation failed, removing token:', error.response?.status);
          localStorage.removeItem('authToken');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isAdmin: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isAdmin: false,
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Add a periodic token validation (every 5 minutes)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const validateToken = async () => {
      try {
        await userAPI.getProfile();
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('Token expired during session, logging out');
          logout();
        }
      }
    };

    const interval = setInterval(validateToken, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await userAPI.login({ email, password });
      const { token, user } = response.data;
      
      console.log('Login response:', response.data);
      console.log('User role:', user.role, 'isAdmin check:', user.role === 'admin');
      
      localStorage.setItem('authToken', token);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: user.role === 'admin',
      });
      
      console.log('Auth state after login:', {
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin'
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
    });
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await userAPI.register({ name, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: user.role === 'admin',
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await userAPI.updateProfile(userData);
      const updatedUser = response.data.user;
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        isAdmin: updatedUser.role === 'admin',
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

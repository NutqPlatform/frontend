import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loginDoctor as apiLoginDoctor, loginPatient as apiLoginPatient } from '../services/api/auth.api';
import adminAPI from '../services/api/admin.api';
import type { AuthResult } from '../services/api/auth.api';
import type { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const loginDoctor = async (email: string, password: string): Promise<void> => {
    try {
      const result: AuthResult = await apiLoginDoctor({ email, password });
      
      const userData: User = {
        id: result.userId,
        email: result.email,
        role: 'doctor',
      };

      setToken(result.token);
      setUser(userData);
      
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const loginPatient = async (email: string, password: string): Promise<void> => {
    try {
      const result: AuthResult = await apiLoginPatient({ email, password });
      
      const userData: User = {
        id: result.userId,
        email: result.email,
        role: 'patient',
      };

      setToken(result.token);
      setUser(userData);
      
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const loginAdmin = async (email: string, password: string): Promise<void> => {
    try {
      const result = await adminAPI.login({ email, password });
      
      if (!result.success) {
        throw new Error(result.message || 'Admin login failed');
      }

      const userData: User = {
        id: result.userId,
        email: result.email,
        name: result.name,
        role: 'admin',
      };

      setToken(result.token || '');
      setUser(userData);
      
      localStorage.setItem(AUTH_TOKEN_KEY, result.token || '');
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    loginDoctor,
    loginPatient,
    loginAdmin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
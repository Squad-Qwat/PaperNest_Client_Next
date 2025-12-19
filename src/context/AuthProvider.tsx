"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "@/lib/api/services/auth.service";
import type { User } from "@/lib/api/types/user.types";
import type { RegisterDto, LoginEmailDto } from "@/lib/api/types/auth.types";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginEmailDto) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { accessToken } = authService.initializeAuth();
        if (accessToken) {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Logout will clear tokens
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginEmailDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginEmail(credentials);
      setCurrentUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login gagal";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
      setCurrentUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout gagal";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(userData);
      setCurrentUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registrasi gagal";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat user";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    currentUser,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

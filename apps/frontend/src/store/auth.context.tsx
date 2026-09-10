import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IUserPublic } from '../types/user';
import { LoginUserDto, RegisterUserDto } from '../types/auth';
import { authApi } from '../api/auth.api';
import { userApi } from '../api/user.api';
import { getAccessToken, setAccessToken, setOnAuthFailure } from '../api/client';
import { AuthContext, AuthContextValue } from './auth.context.type';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUserPublic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize onAuthFailure callback with API client
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      setAccessToken(null);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  // Silent Refresh Handshake on Boot (Phase 5 Section 15.3 & 17)
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        const refreshResult = await authApi.refresh();
        if (!isMounted) return;

        if (refreshResult.accessToken) {
          const profile = await userApi.getProfile();
          if (isMounted) {
            setUser(profile);
          }
        }
      } catch {
        // Unauthenticated or expired session on boot
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (dto: LoginUserDto): Promise<IUserPublic> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(dto);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (dto: RegisterUserDto) => {
    return await authApi.register(dto);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  }, []);

  const contextValue = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: !!user && !!getAccessToken(),
      isLoading,
      role: user?.role ?? null,
      login,
      register,
      logout,
      refreshProfile,
    };
  }, [user, isLoading, login, register, logout, refreshProfile]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

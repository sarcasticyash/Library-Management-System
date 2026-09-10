import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../store/auth.context.type';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,
      login: async () => {},
      register: async () => {
        throw new Error('AuthContext not found');
      },
      logout: async () => {},
      refreshProfile: async () => {},
    };
  }
  return context;
}

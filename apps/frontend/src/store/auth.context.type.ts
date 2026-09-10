import { createContext } from 'react';
import { IUserPublic, UserRole } from '../types/user';
import { LoginUserDto, RegisterUserDto } from '../types/auth';

export interface AuthContextValue {
  user: IUserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (dto: LoginUserDto) => Promise<IUserPublic | void>;
  register: (dto: RegisterUserDto) => Promise<IUserPublic>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

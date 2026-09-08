import { AuthUserContext } from './user.types';

export type RequestUserContext = AuthUserContext;

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
      user?: RequestUserContext;
    }
  }
}

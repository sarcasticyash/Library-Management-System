import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/error';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
}

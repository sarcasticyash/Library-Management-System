import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { bookRoutes } from './book.routes';
import { circulationRoutes } from './circulation.routes';
import { adminRoutes } from './admin.routes';

export interface ApiRouterOptions {
  auth?: Router;
  users?: Router;
  books?: Router;
  borrowings?: Router;
  admin?: Router;
}

/**
 * Factory function assembling canonical /api/v1 router with optional route overrides for testing.
 */
export function createApiRouter(options?: ApiRouterOptions): Router {
  const apiRouter = Router();

  // Health and metadata routes
  apiRouter.use('/', healthRoutes);

  // Feature routes
  apiRouter.use('/auth', options?.auth ?? authRoutes);
  apiRouter.use('/users', options?.users ?? userRoutes);
  apiRouter.use('/books', options?.books ?? bookRoutes);
  apiRouter.use('/borrowings', options?.borrowings ?? circulationRoutes);
  apiRouter.use('/admin', options?.admin ?? adminRoutes);

  return apiRouter;
}

export const routes = createApiRouter();

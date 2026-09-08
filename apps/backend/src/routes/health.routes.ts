import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

// Liveness probe (can be mounted at /healthz)
router.get('/healthz', HealthController.getLiveness);

// Readiness probe (mounted at /api/v1/health)
router.get('/health', HealthController.getReadiness);

// API metadata (mounted at /api/v1)
router.get('/', HealthController.getApiInfo);

export const healthRoutes = router;

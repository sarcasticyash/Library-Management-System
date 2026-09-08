/**
 * Cloud-Native Library Management System (LMS)
 * Request Validation Middleware
 *
 * Governed by Phase 4 Section 11 (Layered Validation Architecture),
 * Section 6 (RFC 7807 Error Architecture), and Phase 7 (Engineering Standards).
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError, InvalidParam } from '../utils/error';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Reusable Express middleware factory validating request body, query, and path params
 * against canonical Zod schemas. Coerces types and replaces request values with parsed outputs.
 * Formats validation failures into standardized RFC 7807 Problem Details.
 */
export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as typeof req.params;
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as typeof req.query;
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const invalidParams: InvalidParam[] = err.errors.map((e) => ({
          name: e.path.join('.'),
          reason: e.message,
        }));
        return next(
          new ValidationError(
            'Request validation failed on one or more parameters.',
            invalidParams,
          ),
        );
      }
      return next(err);
    }
  };
}

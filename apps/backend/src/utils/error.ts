export interface InvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  timestamp: string;
  invalidParams?: InvalidParam[];
}

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly title: string;
  public abstract readonly code: string;
  public readonly invalidParams: InvalidParam[];

  constructor(message: string, invalidParams: InvalidParam[] = []) {
    super(message);
    this.name = this.constructor.name;
    this.invalidParams = invalidParams;
    Error.captureStackTrace(this, this.constructor);
  }

  public toProblemDetails(instance: string): ProblemDetails {
    return {
      type: `https://api.lms.cloud/errors/${this.code}`,
      title: this.title,
      status: this.statusCode,
      detail: this.message,
      instance,
      code: this.code,
      timestamp: new Date().toISOString(),
      invalidParams: this.invalidParams.length > 0 ? this.invalidParams : undefined,
    };
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly title = 'Bad Request';
  public readonly code = 'ERR-VAL-INVALID-INPUT';
}

export class AuthenticationError extends AppError {
  public readonly statusCode = 401;
  public readonly title = 'Unauthorized';
  public readonly code: string;

  constructor(
    message: string,
    code = 'ERR-AUTH-INVALID-CREDENTIALS',
    invalidParams: InvalidParam[] = [],
  ) {
    super(message, invalidParams);
    this.code = code;
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly title = 'Forbidden';
  public readonly code: string;

  constructor(message: string, code = 'ERR-AUTH-FORBIDDEN', invalidParams: InvalidParam[] = []) {
    super(message, invalidParams);
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly title = 'Not Found';
  public readonly code: string;

  constructor(message: string, code = 'ERR-RES-NOT-FOUND', invalidParams: InvalidParam[] = []) {
    super(message, invalidParams);
    this.code = code;
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly title = 'Conflict';
  public readonly code: string;

  constructor(message: string, code = 'ERR-RES-CONFLICT', invalidParams: InvalidParam[] = []) {
    super(message, invalidParams);
    this.code = code;
  }
}

export class RateLimitExceededError extends AppError {
  public readonly statusCode = 429;
  public readonly title = 'Too Many Requests';
  public readonly code = 'ERR-SEC-RATE-LIMIT';
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  public readonly title = 'Internal Server Error';
  public readonly code = 'ERR-SYS-INTERNAL-ERROR';
}

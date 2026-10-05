/**
 * Centralized error hierarchy for WAQAR.
 *
 * Rules:
 *  - Repositories catch raw DB/Supabase errors and re-throw as WaqarError subclasses
 *  - Services catch repository errors, add context, and re-throw
 *  - Server Actions catch service errors and return typed error responses
 *  - Raw Supabase PostgrestError objects never escape the repository layer
 */

// ---------------------------------------------------------------------------
// Base error
// ---------------------------------------------------------------------------

export class WaqarError extends Error {
  /** HTTP status code hint — used by API routes and Server Actions */
  public readonly statusCode: number;
  /** Machine-readable error code for the client */
  public readonly code: string;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = 'WaqarError';
    this.code = code;
    this.statusCode = statusCode;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ---------------------------------------------------------------------------
// Auth errors
// ---------------------------------------------------------------------------

export class AuthError extends WaqarError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends WaqarError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class InvalidCredentialsError extends WaqarError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotConfirmedError extends WaqarError {
  constructor() {
    super(
      'Please confirm your email address before signing in',
      'EMAIL_NOT_CONFIRMED',
      403
    );
    this.name = 'EmailNotConfirmedError';
  }
}

// ---------------------------------------------------------------------------
// Resource errors
// ---------------------------------------------------------------------------

export class NotFoundError extends WaqarError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} "${identifier}" not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends WaqarError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

export class ValidationError extends WaqarError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// ---------------------------------------------------------------------------
// Business logic errors
// ---------------------------------------------------------------------------

export class BusinessError extends WaqarError {
  constructor(message: string, code = 'BUSINESS_ERROR') {
    super(message, code, 400);
    this.name = 'BusinessError';
  }
}

export class InsufficientStockError extends BusinessError {
  constructor(productName: string, requested: number, available: number) {
    super(
      `Insufficient stock for "${productName}". Requested: ${requested}, available: ${available}`,
      'INSUFFICIENT_STOCK'
    );
    this.name = 'InsufficientStockError';
  }
}

export class CouponError extends BusinessError {
  constructor(message: string, code = 'COUPON_ERROR') {
    super(message, code);
    this.name = 'CouponError';
  }
}

export class OrderError extends BusinessError {
  constructor(message: string, code = 'ORDER_ERROR') {
    super(message, code);
    this.name = 'OrderError';
  }
}

// ---------------------------------------------------------------------------
// Infrastructure errors
// ---------------------------------------------------------------------------

export class DatabaseError extends WaqarError {
  /** Original error from Supabase/Postgres — only logged server-side, never sent to client */
  public readonly originalError: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class StorageError extends WaqarError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR', 500);
    this.name = 'StorageError';
  }
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

export class RateLimitError extends WaqarError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 'RATE_LIMITED', 429);
    this.name = 'RateLimitError';
  }
}

// ---------------------------------------------------------------------------
// Helper: convert Supabase error to WaqarError
// ---------------------------------------------------------------------------

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
}

/**
 * Wraps a raw Supabase/Postgres error into a typed WaqarError.
 * Call this inside repository catch blocks — never re-throw the raw error.
 */
export function toWaqarError(error: unknown, context = 'Database operation'): WaqarError {
  if (error instanceof WaqarError) return error;

  const err = error as SupabaseErrorLike;
  const message = err?.message ?? 'An unexpected error occurred';
  const pgCode = err?.code ?? '';

  // Map common Postgres error codes to appropriate WaqarError subclasses
  switch (pgCode) {
    case '23505': // unique_violation
      return new ConflictError(
        err?.details ?? 'A record with this value already exists'
      );
    case '23503': // foreign_key_violation
      return new ValidationError('Referenced record does not exist', {});
    case '42501': // insufficient_privilege (RLS block)
      return new ForbiddenError();
    case 'PGRST116': // Supabase: row not found
      return new NotFoundError('Record');
    default:
      return new DatabaseError(`${context}: ${message}`, error);
  }
}

// ---------------------------------------------------------------------------
// Server Action response type
// ---------------------------------------------------------------------------

/** Typed result returned by all Server Actions */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError<T>(error: WaqarError): ActionResult<T> {
  return {
    success: false,
    error: error.message,
    code: error.code,
    ...(error instanceof ValidationError && { fieldErrors: error.fieldErrors }),
  };
}

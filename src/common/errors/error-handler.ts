import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './app-error.js';
import { env } from '../../config/env.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.error(error);

  if (error instanceof AppError) {
    void reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  // Fastify Validation Errors
  if (error.validation) {
    void reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Invalid request parameters',
      },
    });
    return;
  }

  // Rate Limiting Error
  if (error.statusCode === 429) {
    void reply.status(429).send({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      },
    });
    return;
  }

  // JWT or Auth errors from fastify-jwt plugin
  if (error.statusCode === 401) {
    void reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed or token missing',
      },
    });
    return;
  }

  // Default Internal Server Error (Sanitized for VAPT compliance)
  const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600
    ? error.statusCode
    : 500;

  const isProd = env.NODE_ENV === 'production';
  const responseMessage = isProd
    ? 'An unexpected error occurred on the server'
    : error.message || 'Internal server error';

  void reply.status(statusCode).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: responseMessage,
    },
  });
}

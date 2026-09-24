import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

// Reuses the caller's id (e.g. from the ingress) or mints one, and echoes it for logs and ErrorResponse.
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader(REQUEST_ID_HEADER, req.header(REQUEST_ID_HEADER) ?? crypto.randomUUID());
  next();
}

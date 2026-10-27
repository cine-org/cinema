import type { Request } from 'express';

// Stored for the session list only; capped so a huge header cannot bloat the row.
const MAX_USER_AGENT_LENGTH = 512;

export function clientInfo(request: Request): {
  userAgent: string | null;
  ipAddress: string | null;
} {
  return {
    userAgent: request.headers['user-agent']?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
    ipAddress: request.ip ?? null,
  };
}

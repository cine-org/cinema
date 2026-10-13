import { isIPv6 } from 'node:net';
import type { Request } from 'express';

// The address a per-IP limit counts against. request.ip honours the `trust proxy` setting, so
// forwarded headers are only used behind a configured proxy. IPv6 is grouped by /64: one
// subscriber usually gets a whole /64 and could otherwise rotate addresses freely.
export function clientIpKey(request: Request): string {
  const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
  if (ip.startsWith('::ffff:')) return ip.slice('::ffff:'.length);
  return isIPv6(ip) ? `${expandIPv6(ip).slice(0, 4).join(':')}::/64` : ip;
}

function expandIPv6(ip: string): string[] {
  const [head = '', tail = ''] = ip.split('%')[0]!.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const missing = ip.includes('::') ? 8 - left.length - right.length : 0;
  return [...left, ...Array<string>(missing).fill('0'), ...right].map((part) =>
    part.toLowerCase().padStart(4, '0'),
  );
}

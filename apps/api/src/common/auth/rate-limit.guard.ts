import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommonException } from '@repo/shared';
import type { Request } from 'express';
import { RATE_LIMIT } from './auth.decorators';

type Policy = { readonly limit: number; readonly windowSeconds: number };
type Bucket = { count: number; resetAt: number };

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<Policy>(RATE_LIMIT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!policy) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const key = `${request.ip ?? request.socket.remoteAddress ?? 'unknown'}:${context.getClass().name}:${context.getHandler().name}`;
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + policy.windowSeconds * 1000 });
      this.cleanup(now);
      return true;
    }
    current.count += 1;
    if (current.count > policy.limit)
      throw CommonException.tooManyRequests({ message: 'Too many authentication attempts' });
    return true;
  }

  private cleanup(now: number): void {
    if (this.buckets.size < 1000) return;
    for (const [key, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(key);
  }
}

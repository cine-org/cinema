import type { INestApplication } from '@nestjs/common';
import type { Express } from 'express';

// Decides what request.ip is behind a load balancer; per-IP rate limits depend on it.
export function setupProxy(app: INestApplication, trustProxy: boolean | number | string): void {
  const express = app.getHttpAdapter().getInstance() as Express;
  express.set('trust proxy', trustProxy);
}

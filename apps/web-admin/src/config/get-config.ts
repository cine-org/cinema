import { connection } from 'next/server';
import type { AppConfig } from './config-provider';

// connection() opts into request-time rendering, so env is read at runtime, not at build
export async function getConfig(): Promise<AppConfig> {
  await connection();
  return { apiOrigin: process.env.API_ORIGIN?.trim() || 'http://localhost:3000' };
}

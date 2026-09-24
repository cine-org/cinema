export const dynamic = 'force-dynamic';

export function GET() {
  const config = {
    apiOrigin: process.env.API_ORIGIN?.trim() || 'http://localhost:3000',
  };

  return new Response(`window.__APP_CONFIG__ = ${JSON.stringify(config)};\n`, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  });
}

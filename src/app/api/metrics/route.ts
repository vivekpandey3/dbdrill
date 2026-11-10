import { NextResponse } from 'next/server';
import { getPrometheusMetricsText } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = getPrometheusMetricsText();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}


import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { runDbDrill } from '@/lib/dockerRunner';
import { recordDrillRun } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

function getSampleContent(engine: 'postgres' | 'mongodb', sample: 'healthy' | 'corrupted'): string {
  const rootDir = process.cwd();
  let filename = '';

  if (engine === 'postgres') {
    filename = sample === 'healthy' ? 'healthy.sql' : 'corrupted.sql';
  } else {
    filename = sample === 'healthy' ? 'mongo_healthy.json' : 'mongo_corrupted.json';
  }

  const filePath = path.join(rootDir, 'sample_data', filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }

  throw new Error(`Sample file ${filename} not found at ${filePath}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { engine, type, sample, content: customContent } = body;

    if (engine !== 'postgres' && engine !== 'mongodb') {
      return NextResponse.json(
        { error: 'Invalid engine. Must be "postgres" or "mongodb".' },
        { status: 400 }
      );
    }

    let payload = '';

    if (type === 'demo') {
      if (sample !== 'healthy' && sample !== 'corrupted') {
        return NextResponse.json(
          { error: 'Invalid sample type. Must be "healthy" or "corrupted".' },
          { status: 400 }
        );
      }
      payload = getSampleContent(engine, sample);
    } else if (type === 'custom') {
      if (typeof customContent !== 'string') {
        return NextResponse.json(
          { error: 'Custom drill content must be provided as a string.' },
          { status: 400 }
        );
      }
      payload = customContent;
    } else {
      return NextResponse.json(
        { error: 'Invalid drill type. Must be "demo" or "custom".' },
        { status: 400 }
      );
    }

    // Execute the drill
    const result = await runDbDrill(engine, payload);

    // Record observability metrics for Prometheus
    recordDrillRun(engine, result.success, result.durationMs);

    return NextResponse.json({
      ...result,
      sampleUsed: type === 'demo' ? sample : 'custom',
    });
  } catch (err: any) {
    console.error('Drill endpoint error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error executing drill',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Helpful endpoint to inspect or load sample contents
  const url = new URL(req.url);
  const engine = url.searchParams.get('engine') as 'postgres' | 'mongodb' | null;
  const sample = url.searchParams.get('sample') as 'healthy' | 'corrupted' | null;

  if (engine && sample) {
    try {
      const content = getSampleContent(engine, sample);
      return NextResponse.json({ engine, sample, content });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
  }

  return NextResponse.json({
    status: 'DBDrill API active',
    supportedEngines: ['postgres', 'mongodb'],
  });
}


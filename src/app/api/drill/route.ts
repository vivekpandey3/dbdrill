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
    const contentType = req.headers.get('content-type') || '';

    let engine: 'postgres' | 'mongodb';
    let type: 'demo' | 'custom';
    let sample: 'healthy' | 'corrupted' | undefined;
    let payload = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      engine = (formData.get('engine') as 'postgres' | 'mongodb') || 'postgres';
      type = (formData.get('type') as 'demo' | 'custom') || 'custom';
      sample = (formData.get('sample') as 'healthy' | 'corrupted') || undefined;

      const file = formData.get('file');
      if (file && typeof file === 'object' && 'text' in file) {
        payload = await (file as File).text();
      } else {
        const customContent = formData.get('content');
        if (typeof customContent === 'string') {
          payload = customContent;
        }
      }
    } else {
      const body = await req.json();
      engine = body.engine;
      type = body.type;
      sample = body.sample;
      payload = body.content || '';
    }

    if (engine !== 'postgres' && engine !== 'mongodb') {
      return NextResponse.json(
        { error: 'Invalid engine. Must be "postgres" or "mongodb".' },
        { status: 400 }
      );
    }

    if (type === 'demo') {
      if (sample !== 'healthy' && sample !== 'corrupted') {
        return NextResponse.json(
          { error: 'Invalid sample type. Must be "healthy" or "corrupted".' },
          { status: 400 }
        );
      }
      payload = getSampleContent(engine, sample);
    } else if (type === 'custom') {
      if (!payload || typeof payload !== 'string' || !payload.trim()) {
        return NextResponse.json(
          { error: 'Custom drill content or dump file must be provided.' },
          { status: 400 }
        );
      }
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


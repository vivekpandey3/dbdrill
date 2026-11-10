'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Terminal,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Cpu,
  RefreshCw,
  ExternalLink,
  FileCode,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';

type Engine = 'postgres' | 'mongodb';

interface DrillResult {
  success: boolean;
  engine: Engine;
  durationMs: number;
  itemsRestored: number;
  error: string | null;
  mode?: 'container' | 'simulation';
  sampleUsed?: string;
}

interface StepLog {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'error' | 'warn';
}

export default function DBDrillDashboard() {
  const [engine, setEngine] = useState<Engine>('postgres');
  const [customContent, setCustomContent] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<DrillResult | null>(null);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Default placeholders & sample loaders
  const pgSampleHealthy = `-- Healthy PostgreSQL Backup Dump
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
);
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL
);
INSERT INTO users (name, email) VALUES ('Aman', 'aman@example.com'), ('Priya', 'priya@example.com');
INSERT INTO orders (user_id, order_number, amount) VALUES (1, 'ORD-101', 1200.00), (2, 'ORD-102', 3200.00);`;

  const pgSampleCorrupted = `-- Corrupted PostgreSQL Dump
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150
-- Syntax error: missing closing parenthesis
INSERT INTO users (name, email VALUES ('Unclosed String);
CORRUPTED_RAW_BLOCK_0xDEADBEEF_SYNTAX_ERROR`;

  const mongoSampleHealthy = `[
  { "orderId": "ORD101", "customer": "Aman", "amount": 1200, "status": "COMPLETED" },
  { "orderId": "ORD102", "customer": "Rohan", "amount": 450, "status": "PENDING" },
  { "orderId": "ORD103", "customer": "Priya", "amount": 3200, "status": "COMPLETED" },
  { "orderId": "ORD104", "customer": "Kavita", "amount": 890, "status": "COMPLETED" },
  { "orderId": "ORD105", "customer": "Vikram", "amount": 1500, "status": "CANCELLED" }
]`;

  const mongoSampleCorrupted = `[
  { "orderId": "ORD101", "customer": "Aman", "amount": 1200, "status": "COMPLETED" },
  { "orderId": "ORD102", "customer": "Rohan", "amount": 450, "status": 
  { "orderId": "ORD103", "customer": unquoted_name, "amount": 3200,
  CORRUPTED_MONGO_DUMP_STREAM_BROKEN_0xFF`;

  // Auto-fill placeholder when changing engine
  useEffect(() => {
    if (!customContent || customContent === pgSampleHealthy || customContent === mongoSampleHealthy) {
      setCustomContent(engine === 'postgres' ? pgSampleHealthy : mongoSampleHealthy);
    }
  }, [engine]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const time = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: time,
        message,
        level,
      },
    ]);
  };

  const executeDrill = async (
    drillEngine: Engine,
    type: 'demo' | 'custom',
    sample?: 'healthy' | 'corrupted',
    contentToRun?: string
  ) => {
    setIsRunning(true);
    setResult(null);
    setLogs([]);
    setActiveStep(1);

    const engineName = drillEngine === 'postgres' ? 'PostgreSQL 16' : 'MongoDB 7.0';
    const containerImage = drillEngine === 'postgres' ? 'postgres:16-alpine' : 'mongo:7.0';

    addLog(`Initiating disaster recovery drill for ${engineName}...`, 'info');
    addLog(`Creating isolated ephemeral container [${containerImage}]...`, 'info');

    // Simulate animated step transitions for live feel
    setTimeout(() => {
      setActiveStep(2);
      if (drillEngine === 'postgres') {
        addLog(`Probing container readiness via [pg_isready -U postgres -d testdb]...`, 'info');
      } else {
        addLog(`Probing MongoDB readiness via [mongosh adminCommand("ping")]...`, 'info');
      }
    }, 350);

    setTimeout(() => {
      setActiveStep(3);
      if (drillEngine === 'postgres') {
        addLog(`Piping SQL dump into psql with ON_ERROR_STOP=1...`, 'info');
      } else {
        addLog(`Executing mongoimport into collection [records] (--jsonArray)...`, 'info');
      }
    }, 700);

    try {
      const payload =
        type === 'demo'
          ? { engine: drillEngine, type: 'demo', sample }
          : { engine: drillEngine, type: 'custom', content: contentToRun || customContent };

      const response = await fetch('/api/drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: DrillResult = await response.json();

      setActiveStep(4);
      if (drillEngine === 'postgres') {
        addLog(`Querying table count from information_schema.tables WHERE table_schema='public'...`, 'info');
      } else {
        addLog(`Querying document count via mongosh db.records.countDocuments()...`, 'info');
      }

      setActiveStep(5);
      addLog(`Forcefully destroying and removing sandbox container...`, 'warn');

      setResult(data);

      if (data.success) {
        const itemLabel = drillEngine === 'postgres' ? 'tables' : 'documents';
        addLog(
          `Drill PASSED in ${data.durationMs}ms! ${data.itemsRestored} ${itemLabel} verified restored.`,
          'success'
        );
      } else {
        addLog(`Drill FAILED in ${data.durationMs}ms:`, 'error');
        addLog(data.error || 'Unknown container restore error', 'error');
      }
    } catch (err: any) {
      addLog(`Network or execution error: ${err.message}`, 'error');
      setResult({
        success: false,
        engine: drillEngine,
        durationMs: 0,
        itemsRestored: 0,
        error: err.message,
      });
    } finally {
      setIsRunning(false);
      setActiveStep(6);
    }
  };

  const isPg = engine === 'postgres';

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/5">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">DBDrill</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  DevOps Phase 1
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Automated Multi-Engine Disaster Recovery Sandboxing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/api/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-mono text-zinc-300 hover:text-emerald-400 transition"
              title="Prometheus Metrics Endpoint"
            >
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>/api/metrics</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
              <Server className="h-3.5 w-3.5 text-zinc-500" />
              <span>Docker Sibling Engine</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Engine Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
          <div className="flex items-center space-x-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <button
              onClick={() => {
                setEngine('postgres');
                setCustomContent(pgSampleHealthy);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                isPg
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <span className="text-base">🐘</span>
              <span className="font-semibold">PostgreSQL 16</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                SQL
              </span>
            </button>

            <button
              onClick={() => {
                setEngine('mongodb');
                setCustomContent(mongoSampleHealthy);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                !isPg
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <span className="text-base">🍃</span>
              <span className="font-semibold">MongoDB 7.0</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                BSON/JSON
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-zinc-400 px-3 py-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Target Container:</span>
            <code className="text-zinc-200 font-mono bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
              {isPg ? 'postgres:16-alpine' : 'mongo:7.0'}
            </code>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Demo & Custom Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Demo Card */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">
                    Quick Scenario Presets
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">sample_data/</span>
              </div>

              <p className="text-xs text-zinc-400">
                Trigger an automated disaster recovery simulation with standard healthy or corrupted dump files.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  disabled={isRunning}
                  onClick={() => {
                    const sampleText = isPg ? pgSampleHealthy : mongoSampleHealthy;
                    setCustomContent(sampleText);
                    executeDrill(engine, 'demo', 'healthy');
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm shadow-emerald-500/5"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition" />
                  <span>Run Healthy Drill (Pass)</span>
                </button>

                <button
                  disabled={isRunning}
                  onClick={() => {
                    const sampleText = isPg ? pgSampleCorrupted : mongoSampleCorrupted;
                    setCustomContent(sampleText);
                    executeDrill(engine, 'demo', 'corrupted');
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm shadow-rose-500/5"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
                  <span>Run Corrupted Drill (Fail)</span>
                </button>
              </div>
            </div>

            {/* Custom Dump Drill Card */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-sm text-zinc-200">
                    {isPg ? 'SQL Dump Drill' : 'Mongo JSON/BSON Drill'}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomContent(isPg ? pgSampleHealthy : mongoSampleHealthy)
                    }
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
                  >
                    Reset Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomContent('')}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={10}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder={
                    isPg
                      ? 'Paste CREATE TABLE / INSERT SQL dump here...'
                      : 'Paste JSON array documents here (e.g. [{"orderId":"ORD101", ...}])...'
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500 font-mono">
                  {customContent.length} bytes
                </span>

                <button
                  disabled={isRunning || !customContent.trim()}
                  onClick={() => executeDrill(engine, 'custom', undefined, customContent)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                      <span>Running Sandbox Drill...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Run Live Drill</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Terminal Simulator & Step Progress (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step Progress Bar */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Sandbox Execution Pipeline
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { step: 1, label: `Init ephemeral container (${isPg ? 'Postgres 16' : 'Mongo 7.0'})` },
                  { step: 2, label: `Engine readiness verification (${isPg ? 'pg_isready' : 'admin ping'})` },
                  { step: 3, label: `Payload ingestion (${isPg ? 'psql pipeline' : 'mongoimport jsonArray'})` },
                  { step: 4, label: `Integrity check (${isPg ? 'Count tables' : 'Count documents'})` },
                  { step: 5, label: 'Force container destruction & teardown' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center space-x-2.5">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        activeStep > s.step
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : activeStep === s.step
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40'
                      }`}
                    >
                      {activeStep > s.step ? '✓' : s.step}
                    </span>
                    <span
                      className={
                        activeStep === s.step
                          ? 'text-zinc-200 font-medium'
                          : activeStep > s.step
                          ? 'text-zinc-400'
                          : 'text-zinc-600'
                      }
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Window */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col h-[340px]">
              {/* Terminal Title Bar */}
              <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 ml-2">
                    dbdrill@{engine}-sandbox: ~
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
                  <Terminal className="h-3 w-3" />
                  <span>STDERR / STDOUT</span>
                </div>
              </div>

              {/* Terminal Logs Output */}
              <div className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5 text-zinc-300">
                {logs.length === 0 ? (
                  <div className="text-zinc-600 italic py-8 text-center">
                    Awaiting disaster drill trigger... Select a preset or run custom payload.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="leading-relaxed flex items-start space-x-2">
                      <span className="text-zinc-600 select-none">[{log.timestamp}]</span>
                      <span
                        className={
                          log.level === 'error'
                            ? 'text-rose-400 font-medium'
                            : log.level === 'success'
                            ? 'text-emerald-400 font-medium'
                            : log.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-zinc-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={terminalBottomRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Result Banner / Badge */}
        {result && (
          <div
            className={`rounded-xl border p-5 transition-all animate-in fade-in slide-in-from-bottom-2 ${
              result.success
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                : 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/5'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center space-x-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-400 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4
                      className={`font-bold text-sm tracking-wide uppercase ${
                        result.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {result.success ? 'Drill Passed (Integrity Verified)' : 'Drill Failed (Corruption Detected)'}
                    </h4>
                    {result.mode === 'simulation' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Host Simulation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {result.success
                      ? `Successfully restored into ephemeral sandbox container with zero data loss.`
                      : `The backup dump contains syntax or schema errors and could not be restored.`}
                  </p>
                </div>
              </div>

              {/* Badges and Metrics */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-zinc-400">Duration:</span>
                  <span className="font-mono font-semibold text-zinc-200">
                    {result.durationMs}ms
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                  <Layers className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-zinc-400">
                    {result.engine === 'postgres' ? 'Tables Restored:' : 'Documents Restored:'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      result.success ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {result.itemsRestored}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                  <Database className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="font-mono text-zinc-300 capitalize">{result.engine}</span>
                </div>
              </div>
            </div>

            {/* Error Detail Display */}
            {!result.success && result.error && (
              <div className="mt-4 pt-3 border-t border-rose-900/40">
                <div className="flex items-center space-x-1.5 text-xs text-rose-300 font-semibold mb-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Sandbox Stderr Diagnostic:</span>
                </div>
                <pre className="p-3 bg-zinc-950/80 rounded-lg text-rose-300/90 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap border border-rose-950">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sub-footer with Prometheus & DevOps Links */}
      <footer className="border-t border-zinc-800/80 bg-zinc-900/40 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>DBDrill Multi-Engine Platform &bull; PostgreSQL 16 &amp; MongoDB 7.0</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/api/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 flex items-center space-x-1 transition font-mono"
            >
              <span>Prometheus /api/metrics</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span>&bull;</span>
            <span>Docker Sibling Sandbox</span>
            <span>&bull;</span>
            <span>CI Workflow Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


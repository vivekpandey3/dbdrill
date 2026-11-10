// Singleton metrics store for Prometheus observability

interface DrillMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastDurationMs: number;
  postgresRuns: number;
  mongodbRuns: number;
}

// Global scope preserve across Next.js hot reloads in development
const globalForMetrics = globalThis as unknown as {
  dbDrillMetrics: DrillMetrics | undefined;
};

export const metrics: DrillMetrics = globalForMetrics.dbDrillMetrics ?? {
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  lastDurationMs: 0,
  postgresRuns: 0,
  mongodbRuns: 0,
};

if (process.env.NODE_ENV !== 'production') {
  globalForMetrics.dbDrillMetrics = metrics;
}

export function recordDrillRun(engine: 'postgres' | 'mongodb', success: boolean, durationMs: number) {
  metrics.totalRuns += 1;
  metrics.lastDurationMs = durationMs;
  if (success) {
    metrics.successfulRuns += 1;
  } else {
    metrics.failedRuns += 1;
  }
  if (engine === 'postgres') {
    metrics.postgresRuns += 1;
  } else if (engine === 'mongodb') {
    metrics.mongodbRuns += 1;
  }
}

export function getPrometheusMetricsText(): string {
  return [
    '# HELP db_drill_total_runs Total number of database disaster recovery drills executed',
    '# TYPE db_drill_total_runs counter',
    `db_drill_total_runs ${metrics.totalRuns}`,
    '',
    '# HELP db_drill_successful_runs Total number of successful database drills',
    '# TYPE db_drill_successful_runs counter',
    `db_drill_successful_runs ${metrics.successfulRuns}`,
    '',
    '# HELP db_drill_failed_runs Total number of failed database drills',
    '# TYPE db_drill_failed_runs counter',
    `db_drill_failed_runs ${metrics.failedRuns}`,
    '',
    '# HELP db_drill_last_duration_ms Duration of the most recently executed drill in milliseconds',
    '# TYPE db_drill_last_duration_ms gauge',
    `db_drill_last_duration_ms ${metrics.lastDurationMs}`,
    '',
    '# HELP db_drill_engine_runs Breakdown of drills per database engine',
    '# TYPE db_drill_engine_runs counter',
    `db_drill_engine_runs{engine="postgres"} ${metrics.postgresRuns}`,
    `db_drill_engine_runs{engine="mongodb"} ${metrics.mongodbRuns}`,
    '',
  ].join('\n');
}


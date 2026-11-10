# DBDrill ⚡

Automated Multi-Engine Database Disaster Recovery and Chaos Testing Sandbox.

DBDrill provides isolated, ephemeral Docker container sandboxes to simulate and verify database restore dumps for **PostgreSQL 16** and **MongoDB 7.0**.

---

## 🏗️ Architecture Overview

```
                      +-----------------------------+
                      |     DBDrill Web Client      |
                      | (Next.js 14 / Tailwind CSS) |
                      +--------------+--------------+
                                     |
               POST /api/drill       |       GET /api/metrics
                                     v
            +-----------------------------------------------+
            |               Next.js API Engine              |
            |   (Platform socket: Dockerode cross-platform) |
            +-----------------------+-----------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +--------------------+
|  postgres:16-alpine   |                           |     mongo:7.0      |
|  - pg_isready probe   |                           |  - mongosh ping    |
|  - psql stream restore|                           |  - mongoimport     |
|  - table count query  |                           |  - countDocuments  |
|  - container teardown |                           |  - teardown        |
+-----------------------+                           +--------------------+
```

---

## 🚀 Key Features

1. **Multi-Engine Disaster Recovery**:
   - **PostgreSQL 16**: Validates SQL syntax, foreign key constraints, table creation, and records restored.
   - **MongoDB 7.0**: Validates JSON/BSON structures, mongoimport ingestion, and document counts.
2. **Sibling Docker Sandboxing**:
   - Spawns isolated, ephemeral containers per drill.
   - Forcefully purges containers in a `finally` block to prevent resource leaks.
   - Cross-platform socket handling (`//./pipe/docker_engine` on Windows, `/var/run/docker.sock` on Linux/macOS).
3. **DevOps Observability**:
   - Prometheus-compatible metrics endpoint at `/api/metrics`.
   - Exposes `db_drill_total_runs`, `db_drill_successful_runs`, `db_drill_failed_runs`, and `db_drill_last_duration_ms`.
4. **CI/CD Automation**:
   - GitHub Actions workflow (`.github/workflows/db-drill-ci.yml`) runs on push, pull request, and daily midnight cron schedule (`0 0 * * *`).
   - Multi-stage production `Dockerfile` with minimal `node:20-alpine`.
   - Sibling Docker composition via `docker-compose.yml`.

---

## 📦 Project Structure

```
├── .github/workflows/
│   └── db-drill-ci.yml          # GitHub Actions daily & push CI
├── sample_data/
│   ├── healthy.sql              # Valid PostgreSQL dump (users + orders)
│   ├── corrupted.sql            # Broken SQL dump with syntax errors
│   ├── mongo_healthy.json       # Valid MongoDB 5-document dump
│   └── mongo_corrupted.json     # Corrupted/broken JSON dump
├── scripts/
│   └── test-samples.js          # CI and local dump verification test
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── drill/route.ts   # Core drill trigger API
│   │   │   └── metrics/route.ts # Prometheus /api/metrics endpoint
│   │   ├── globals.css          # Dark-theme styles
│   │   ├── layout.tsx           # Root Next.js layout
│   │   └── page.tsx             # Interactive dashboard
│   └── lib/
│       ├── dockerRunner.ts      # Multi-engine Dockerode runner
│       └── metrics.ts           # Prometheus metrics store
├── docker-compose.yml           # Host Docker socket mount orchestration
├── Dockerfile                   # Multi-stage production image build
└── package.json
```

---

## 🛠️ Getting Started

### Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Sample Verification
```bash
npm run test:sample
```

### Docker Compose Run
```bash
docker compose up --build
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Prometheus Metrics
Fetch live Prometheus metrics:
```bash
curl http://localhost:3000/api/metrics
```
Example Output:
```text
# HELP db_drill_total_runs Total number of database disaster recovery drills executed
# TYPE db_drill_total_runs counter
db_drill_total_runs 4

# HELP db_drill_successful_runs Total number of successful database drills
# TYPE db_drill_successful_runs counter
db_drill_successful_runs 3

# HELP db_drill_failed_runs Total number of failed database drills
# TYPE db_drill_failed_runs counter
db_drill_failed_runs 1

# HELP db_drill_last_duration_ms Duration of the most recently executed drill in milliseconds
# TYPE db_drill_last_duration_ms gauge
db_drill_last_duration_ms 712
```


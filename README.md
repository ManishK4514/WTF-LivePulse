# WTF LivePulse

Real-time multi-gym intelligence dashboard for WTF Gyms. Displays live occupancy, revenue, anomalies, and analytics across 10 locations.

**Stack:** React 18 · Node.js · PostgreSQL 15 · Docker Compose · WebSocket (ws) · Recharts · Zustand · TailwindCSS

---

## Quick Start

```bash
git clone <repo-url> wtf-livepulse
cd wtf-livepulse
docker compose up
```

That's it. On first boot:
1. Postgres starts and auto-runs `001_schema.sql` + `002_indexes_and_views.sql`
2. Backend waits for the DB healthcheck, then runs the seed script (~30–45 seconds for 270k rows)
3. Frontend builds and is served via nginx on port 3000

Open **http://localhost:3000** — data is live immediately.

| Service  | URL                         |
|----------|-----------------------------|
| Frontend | http://localhost:3000        |
| API      | http://localhost:3001/api    |
| DB       | localhost:5432               |

---

## Architecture Decisions

### Why BRIN on `checkins.checked_in`?

Check-ins are an append-only time-series: rows are written in roughly chronological order and never updated (only the `checked_out` column is filled in later). BRIN (Block Range Index) exploits this physical correlation — it stores only the min/max value per 128-page block instead of indexing every row. At 270k+ rows it is ~200× smaller than a B-tree and still filters range queries to a handful of blocks. For queries like "all check-ins in the last 7 days" it gives sub-millisecond performance with negligible storage overhead.

### Why a partial index on `checked_out IS NULL`?

The live occupancy query cares only about *currently open* check-ins — roughly 100–350 rows out of 270k+. A standard B-tree on `(gym_id, checked_out)` would index all 270k rows; a partial index `WHERE checked_out IS NULL` indexes only the tiny open subset. The index fits entirely in L2 cache, making per-gym occupancy lookups effectively instant (< 0.5ms).

### Why a partial index on `anomalies WHERE resolved = FALSE`?

The anomaly detector runs every 30 seconds and queries active anomalies per gym. Resolved anomalies accumulate over time but are never queried in hot paths. The partial index over `resolved = FALSE` keeps the index footprint near-zero and the lookup time constant regardless of historical anomaly volume.

### Why a Materialized View for the heatmap?

Aggregating 90 days of check-ins by day-of-week and hour-of-day (7×24×10 gyms = 1,680 cells) on every analytics page load would require scanning 270k rows each time. The materialized view pre-computes this and stores 1,680 rows; the heatmap query becomes a 168-row index scan taking < 0.3ms. It is refreshed every 15 minutes via `setInterval` in the backend, and also after the seed completes.

### Why native WebSocket (`ws`) instead of Socket.io?

Socket.io adds ~200KB of client JavaScript and a custom protocol with long-polling fallback. The spec requires real push (no polling) and all modern browsers support native WebSocket. Using `ws` on the server and the native `WebSocket` API on the client keeps both bundles minimal, avoids abstraction overhead, and makes the event protocol explicit and inspectable.

### Seed idempotency

The seed checks `SELECT COUNT(*) FROM gyms` on startup. If the count is non-zero it exits immediately. All inserts use `ON CONFLICT DO NOTHING`. This means re-running the backend against an already-seeded database is safe with no side effects.

### Anomaly detection design

The detector is a pure side-effect loop (no state between runs) — each 30-second tick queries current DB state and compares against stored anomaly records. This makes it restartable, testable, and immune to in-memory state loss on crash. Auto-resolve is implemented by checking the inverse condition (occupancy < 85%, recent check-ins exist, revenue recovered) and calling `UPDATE anomalies SET resolved = TRUE`.

---

## AI Tools Used

| Tool | Used For |
|------|----------|
| **Claude (claude-sonnet-4-6)** | Entire implementation — architecture planning, all backend and frontend code, SQL schema and index design, seed script, test suite, this README |

This project was built entirely with Claude Code (Anthropic's CLI) as a technical assignment. Every file was written by the AI assistant based on the provided specification.

---

## Query Benchmarks

Run these after `docker compose up` to reproduce:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <query>;
```

| # | Query | Description | Target | Index Used |
|---|-------|-------------|--------|------------|
| Q1 | `SELECT COUNT(*) FROM checkins WHERE gym_id = $1 AND checked_out IS NULL` | Live occupancy (single gym) | < 0.5ms | `idx_checkins_live_occupancy` (partial) |
| Q2 | `SELECT COALESCE(SUM(amount),0) FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE` | Today's revenue (single gym) | < 0.8ms | `idx_payments_gym_date` |
| Q3 | `SELECT id, name, last_checkin_at FROM members WHERE status='active' AND last_checkin_at < NOW() - INTERVAL '45 days'` | Churn risk members | < 1ms | `idx_members_churn_risk` (partial) |
| Q4 | `SELECT * FROM gym_hourly_stats WHERE gym_id = $1` | Peak heatmap (mat view) | < 0.3ms | Materialized view unique index |
| Q5 | `SELECT gym_id, SUM(amount) FROM payments WHERE paid_at >= NOW() - INTERVAL '30 days' GROUP BY gym_id` | Cross-gym revenue | < 2ms | `idx_payments_date` (BRIN range) |
| Q6 | `SELECT * FROM anomalies WHERE resolved = FALSE AND dismissed = FALSE` | Active anomalies | < 0.3ms | `idx_anomalies_active` (partial) |

EXPLAIN ANALYZE screenshots are in [`/benchmarks/screenshots/`](./benchmarks/screenshots/).

> **Note:** Benchmarks should be run after the seed completes and the materialized view is populated. Connect via `docker exec -it <db-container> psql -U wtf -d wtf_livepulse`.

---

## Validation Queries

After seeding, verify data integrity:

```sql
SELECT COUNT(*) FROM gyms;                  -- 10
SELECT COUNT(*) FROM members;               -- 5000
SELECT COUNT(*) FROM members WHERE status = 'active';   -- 4100–4400
SELECT COUNT(*) FROM checkins;              -- 250000–300000
SELECT COUNT(*) FROM checkins WHERE checked_out IS NULL;  -- 100–350
SELECT COUNT(*) FROM payments;              -- 5000–6000
SELECT COUNT(*) FROM members
  WHERE last_checkin_at < NOW() - INTERVAL '45 days'
    AND status = 'active';                  -- 230+
SELECT COUNT(*) FROM checkins
  WHERE gym_id = (SELECT id FROM gyms WHERE name ILIKE '%Bandra%')
    AND checked_out IS NULL;                -- 270–300
SELECT COUNT(*) FROM checkins
  WHERE gym_id = (SELECT id FROM gyms WHERE name ILIKE '%Velachery%')
    AND checked_out IS NULL;                -- 0
```

---

## Running Tests

### Unit tests (no DB required)
```bash
cd backend
npm install
npm run test:unit
```

### Integration tests (requires running DB)
```bash
# With docker compose running:
DATABASE_URL=postgres://wtf:wtf_secret@localhost:5432/wtf_livepulse npm run test:integration
```

### E2E tests (requires full stack running)
```bash
cd frontend
npm install
npx playwright install chromium
npm test
```

### Coverage report
```bash
cd backend && npm test
# Opens coverage/ directory
```

---

## Known Limitations

1. **No authentication** — the API and WebSocket are completely open. Anyone with network access can call the simulator endpoints or read all data.

2. **Single-region seed names** — member names use only Indian name pools. The spec requires this, but a production system would use actual member data.

3. **Materialized view refresh** — the 15-minute refresh interval means heatmap data can be up to 15 minutes stale. A production system would use `REFRESH MATERIALIZED VIEW CONCURRENTLY` triggered on write, or a streaming aggregation approach.

4. **E2E tests require a running stack** — Playwright tests assume `http://localhost:3000` is up. They are not self-contained and will fail without `docker compose up` running first.

5. **No migration runner** — schema files are run once by Postgres `docker-entrypoint-initdb.d` on first container start. Adding future migrations requires manual intervention or a tool like Flyway/Liquibase.

6. **Simulator uses random member selection** — it does not model realistic member behavior patterns (e.g., members who come at the same time each day). This means the activity feed can show the same member checking in multiple times rapidly if the simulator runs at 10x.

7. **Revenue drop detection sensitivity** — the current day is compared to the exact same weekday 7 days prior. On Mondays at 8am, last week's Monday will also have only 8 hours of data, making false positives possible in the early hours of the day.

8. **No HTTPS / WSS** — all traffic is plain HTTP/WS. TLS termination would be needed for any real deployment.

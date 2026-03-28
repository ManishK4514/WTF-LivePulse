# WTF LivePulse

A real-time operations dashboard for WTF Gyms — tracks live occupancy, revenue, and anomalies across 10 gym locations. Built as a full-stack assignment.

**Stack:** React 18, Node.js, PostgreSQL 16, Docker Compose, WebSocket (ws), Recharts, Zustand, TailwindCSS

---

## Getting Started

```bash
git clone https://github.com/ManishK4514/WTF-LivePulse.git
cd WTF-LivePulse
docker compose up
```

First boot takes about 30–45 seconds. Here's what happens:
1. Postgres initializes and runs the schema + index migrations automatically
2. The backend waits for Postgres to be healthy, then seeds ~270k rows of historical data
3. The frontend builds and gets served via nginx

Once it's up, open **http://localhost:3000**.

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:3000    |
| API      | http://localhost:3001/api |
| DB       | localhost:5432           |

---

## Architecture Decisions

### BRIN index on `checkins.checked_in`

Check-ins are always appended in time order — nobody backdates a gym visit. BRIN takes advantage of this by storing just the min/max timestamp per 128-page block rather than indexing every single row. At 270k rows it ends up around 200x smaller than a B-tree, and range queries like "last 7 days" still resolve to just a handful of blocks. Storage is negligible, reads are fast.

### Partial index on `checked_out IS NULL`

Live occupancy only cares about who's currently inside — maybe 100–350 rows out of 270k+. A full index on `(gym_id, checked_out)` would carry all that historical baggage for no reason. The partial index only covers open check-ins, fits in cache, and makes per-gym occupancy lookups consistently under 0.5ms regardless of how much history accumulates.

### Partial index on `anomalies WHERE resolved = FALSE`

The anomaly detector fires every 30 seconds and only ever queries unresolved anomalies. Resolved ones pile up over time but are never touched in hot paths. Keeping the index scoped to `resolved = FALSE` means its size stays constant and doesn't grow with history.

### Materialized view for the heatmap

The heatmap aggregates 90 days of check-ins into a 7×24 grid per gym (1,680 cells total). Running that aggregation on every page load would mean scanning 270k rows each time. The materialized view pre-computes it into 1,680 rows — the heatmap query just does a 168-row index scan, under 0.3ms. It refreshes every 15 minutes in the background.

### Native WebSocket over Socket.io

Socket.io ships ~200KB of client JS and adds a custom protocol with long-polling fallback built in. This project needs real push, not polling, and every modern browser has had native WebSocket for years. Using the `ws` package on the server and the browser's native `WebSocket` API on the client keeps things lean and the event protocol is easy to trace in DevTools.

### Seed idempotency

The seed checks `SELECT COUNT(*) FROM gyms` before doing anything. If it finds data, it exits immediately. All inserts use `ON CONFLICT DO NOTHING`. Running the backend against an already-seeded DB is completely safe.

### Anomaly detection

The detector keeps no in-memory state between runs. Every 30-second tick queries the DB fresh and compares against what's stored in the anomalies table. This means it survives restarts cleanly and there's no risk of stale in-memory state causing false positives or missed detections. Auto-resolve works the same way — if the condition is no longer true, it marks the anomaly resolved and broadcasts the update.

---

## AI Tools Used

| Tool | Used For |
|------|----------|
| **Claude Code (claude-sonnet-4-6)** | Architecture planning, backend and frontend implementation, SQL schema + index design, seed script, tests, README |

---

## Query Benchmarks

To reproduce, connect to the DB after seeding:

```bash
docker exec -it <db-container> psql -U wtf -d wtf_livepulse
```

Then run:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <query>;
```

| # | Query | What it does | Target | Index |
|---|-------|-------------|--------|-------|
| Q1 | `SELECT COUNT(*) FROM checkins WHERE gym_id = $1 AND checked_out IS NULL` | Live occupancy | < 0.5ms | `idx_checkins_live_occupancy` (partial) |
| Q2 | `SELECT COALESCE(SUM(amount),0) FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE` | Today's revenue | < 0.8ms | `idx_payments_gym_date` |
| Q3 | `SELECT id, name, last_checkin_at FROM members WHERE status='active' AND last_checkin_at < NOW() - INTERVAL '45 days'` | Churn risk members | < 1ms | `idx_members_churn_risk` (partial) |
| Q4 | `SELECT * FROM gym_hourly_stats WHERE gym_id = $1` | Heatmap data | < 0.3ms | Materialized view index |
| Q5 | `SELECT gym_id, SUM(amount) FROM payments WHERE paid_at >= NOW() - INTERVAL '30 days' GROUP BY gym_id` | Cross-gym revenue | < 2ms | `idx_payments_date` (BRIN) |
| Q6 | `SELECT * FROM anomalies WHERE resolved = FALSE AND dismissed = FALSE` | Active anomalies | < 0.3ms | `idx_anomalies_active` (partial) |

EXPLAIN ANALYZE screenshots are in [`/benchmarks/screenshots/`](./benchmarks/screenshots/).

---

## Validation Queries

Run these after the seed finishes to confirm data looks right:

```sql
SELECT COUNT(*) FROM gyms;                  -- 10
SELECT COUNT(*) FROM members;               -- 5000
SELECT COUNT(*) FROM members WHERE status = 'active';        -- 4100–4400
SELECT COUNT(*) FROM checkins;              -- 250000–300000
SELECT COUNT(*) FROM checkins WHERE checked_out IS NULL;     -- 100–350
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

### Unit tests (no DB needed)
```bash
cd backend
npm install
npm run test:unit
```

### Integration tests (needs a running DB)
```bash
DATABASE_URL=postgres://wtf:wtf_secret@localhost:5432/wtf_livepulse npm run test:integration
```

### E2E tests (needs the full stack running)
```bash
cd frontend
npm install
npx playwright install chromium
npm test
```

### Coverage
```bash
cd backend && npm test
```

---

## Known Limitations

1. **No auth** — the API and WebSocket are wide open. Fine for a local assignment, not for production.

2. **Indian names only in seed** — the member name pool uses Indian first/last names. That's what the spec asked for.

3. **Heatmap can be 15 minutes stale** — the materialized view refreshes on a fixed interval. A production setup would trigger `REFRESH MATERIALIZED VIEW CONCURRENTLY` on writes instead.

4. **E2E tests aren't self-contained** — Playwright assumes `http://localhost:3000` is already up. Run `docker compose up` first.

5. **No migration runner** — schema runs once via Postgres init scripts on first container start. Any future schema changes need manual handling or a proper migration tool.

6. **Simulator doesn't model real behavior** — member selection is random, so at 10x speed you can see the same person check in twice in a row. Real members don't do that.

7. **Revenue drop detection edge case** — it compares today's revenue to the same weekday last week. At 8am on a Monday, last week's Monday also only had 8 hours of data, which can cause false positives early in the day.

8. **HTTP/WS only** — no TLS. Needs a reverse proxy with cert termination for any real deployment.

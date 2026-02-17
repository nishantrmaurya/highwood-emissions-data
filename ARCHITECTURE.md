# Architecture

## 1. System Overview

This project is a two-tier web app:

- `frontend` (Next.js):
  - Renders dashboard and site workflows.
  - Uses server-side API route handlers under `frontend/app/api/*` to proxy browser requests to backend.
  - Subscribes to Socket.IO events for near real-time UI updates.
- `backend` (Express + Prisma + zod):
  - Owns validation, persistence, business logic, and error handling.
  - Writes to PostgreSQL.
  - Emits realtime events through Socket.IO.

PostgreSQL is the system of record. Redis is present in `docker-compose.yml` but currently not required by runtime code.

## 2. API and Domain Structure

Key backend layers:

- Routes: request mapping (`backend/src/routes/*.ts`)
- Controllers: HTTP orchestration and status codes (`backend/src/controllers/*.ts`)
- Services: domain and database operations (`backend/src/services/*.ts`)
- Validation: Zod request schemas (`backend/src/models/site.schema.ts`)
- Error middleware: centralized error payload + DB logging (`backend/src/middleware/errorHandler.ts`)

Core endpoints:

- `POST /sites`: create monitored site
- `POST /ingest`: idempotent batch ingestion (up to 100 measurements)
- `GET /sites/:id/metrics`: site summary + measurements
- `POST /sites/:id/measurements`: manual single-measurement insert
- `GET /measurement/latest`: latest measurements feed

## 3. Data Model and Consistency Strategy

Tables (Prisma models):

- `site`: site metadata + aggregate state (`total_emissions_to_date`, `current_compliance_status`, `last_measurement_at`)
- `measurement`: immutable telemetry rows
- `ingestion_batch`: idempotency ledger keyed by unique `client_batch_id`
- `error_log`: persisted API/runtime errors

### 3.1 Idempotency for unreliable networks

`POST /ingest` requires `client_batch_id`. Flow in `MeasurementService.ingestBatch`:

1. Start transaction.
2. Check site exists.
3. Check existing `ingestion_batch` for same `client_batch_id`.
4. If exists for same site, return previously persisted result (`duplicate_request=true`).
5. If exists for different site, return conflict (`409`).
6. If not exists, create batch and insert measurements with `createMany`.

This prevents duplicate writes and double-counting for retries/timeouts.

### 3.2 Concurrency handling

The unique index on `ingestion_batch.client_batch_id` is a hard database guard. If two concurrent requests race:

- One request wins the insert.
- The other hits Prisma unique error (`P2002`), then re-reads existing batch and returns duplicate-safe response.

This is an optimistic, DB-enforced approach that avoids explicit application locks.

### 3.3 Aggregate correctness

Site aggregates are maintained in PostgreSQL triggers (migration `20260216153000_measurement_site_totals_triggers`), not in application code:

- Converts all units to canonical kilograms (`measurement_to_kg`)
- Updates site totals/compliance/last timestamp after insert/update/delete
- Includes a drift-check SQL helper (`site_emission_total_drift`)

Trade-off:

- Pro: aggregate invariants are centralized and transactionally consistent regardless of write path.
- Con: more logic lives in SQL/PLpgSQL, which is harder to test in TypeScript unit tests.

## 4. Frontend Architecture

### 4.1 API boundary

Browser calls local Next routes (`/api/*`) instead of backend directly:

- Keeps backend base URL server-side (`BACKEND_API_URL` in `frontend/app/api/_lib/backend.ts`)
- Normalizes response handling in `ApiClient` + `ApiError`
- Avoids CORS concerns for browser clients in local/dev setups

### 4.2 UI state and realtime updates

- Dashboard and site detail pages fetch initial state via REST.
- `RealtimeClient` subscribes to:
  - `site.created`
  - `measurement.created`
  - `measurement.batch_ingested`
- UI applies incremental updates to avoid full-page refreshes.

Trade-off:

- Pro: responsive admin UX and quick feedback during ingestion.
- Con: duplicate logic paths (REST refresh + websocket patching) increase state-management complexity.

## 5. Error Handling and Observability

`errorHandler` middleware returns a consistent error envelope:

- `status: "error"`
- `message`
- optional `details`

It also writes to `error_log` with endpoint, request id, error code, severity, and context payload.

Trade-off:

- Pro: consistent client behavior and post-failure traceability.
- Con: logging request context (body/query/params) can increase storage volume and may require tighter redaction rules in production.

## 6. Major Technical Decisions and Trade-offs

1. Use Prisma + PostgreSQL as primary consistency layer:
   - Faster delivery and type-safe access.
   - Less direct SQL control in application layer.
2. Keep idempotency state in relational table (`ingestion_batch`) with unique constraint:
   - Strong correctness under retries/concurrency.
   - Requires client discipline to generate stable `client_batch_id` for retries.
3. Compute/maintain site totals in DB triggers:
   - Prevents drift across all write paths.
   - Adds operational complexity to migration lifecycle.
4. Use Next.js API proxy between UI and backend:
   - Simpler frontend integration and deployment flexibility.
   - Adds one extra hop per request.

## 7. Gaps and Next Steps

Current known gaps:

- Backend automated tests are not implemented yet.
- Redis is provisioned but not yet used for caching/rate limiting/idempotency windows.
- Socket auth and fine-grained authorization are not implemented.

High-impact follow-ups:

1. Add backend integration tests for `/ingest` idempotency and concurrent duplicate requests.
2. Add contract tests for frontend proxy routes and typed API responses.
3. Introduce request-level metrics (ingest created vs duplicate count, trigger drift checks).

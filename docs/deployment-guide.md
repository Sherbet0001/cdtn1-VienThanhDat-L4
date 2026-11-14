# Deployment Guide — Smart CRM Mekong Mobile, flow L4 "Technician assignment" (track SE), tag v1.0

Goal: bring the system up from a machine that has only **Docker and Git**, with **two commands** after cloning. No Node.js and no PostgreSQL are needed.

## 1. Requirements

| Item | Requirement | Check |
|---|---|---|
| OS | Windows 10/11 (Docker Desktop), Linux or macOS | – |
| Docker Engine + Compose | Docker 24+ and Compose v2 (tested with Docker 28.5.2, Compose v2.40) | `docker compose version` |
| Git | 2.30+ | `git --version` |
| Disk space | about 2 GB free (images and the database volume) | – |
| Free port | `3000` on the host (change `API_PORT` in `.env` if it is busy) | – |

The database port 5432 is **not** published to the host, so a PostgreSQL already installed on your machine does not conflict.

## 2. Setup steps

Run each step exactly as written (PowerShell and bash both work unless noted).

1. Clone the release tag into an empty folder:
   ```
   git clone --branch v1.0 https://github.com/Sherbet0001/cdtn1-VienThanhDat-L4.git
   cd cdtn1-VienThanhDat-L4
   ```
2. Create the configuration file (the sample values already work):
   ```
   cp .env.example .env
   ```
   PowerShell alternative: `Copy-Item .env.example .env`
3. Build and start the system:
   ```
   docker compose up -d --build
   ```
   The first build downloads the base images and can take a few minutes. On start, the `api` service waits until the database is healthy, then creates the tables (migrations) and loads the sample data (seeds) **automatically**. Both are safe to repeat: running them again does not duplicate rows.

Steps 2 and 3 are the only two commands needed after cloning.

To stop: `docker compose down` (keeps the data). To reset to a clean state: `docker compose down -v` (deletes the database volume; the sample data is loaded again on the next start).

## 3. Environment variables

All variables are listed in `.env.example`. The real `.env` is never committed.

| Name | Meaning | Sample value | Required |
|---|---|---|---|
| `DB_NAME` | PostgreSQL database name (Docker Compose) | `l4_dev` | yes |
| `DB_USER` | PostgreSQL user (Docker Compose) | `l4_user` | yes |
| `DB_PASSWORD` | PostgreSQL password (Docker Compose). **Change it for any real deployment.** | `change_me` | yes |
| `JWT_SECRET` | Key that signs login tokens (at least 32 characters). **Required**: `docker compose` refuses to start without it. Sample value only; change it for any real deployment. | `change_me_sample_jwt_signing_key_min_32_chars` | yes |
| `JWT_TTL_SECONDS` | How long a login token stays valid | `3600` | no (default 3600) |
| `API_PORT` | Host port that maps to the API | `3000` | no (default 3000) |
| `DB_POOL_MAX` | Maximum database connections in the pool | `10` | no (default 10) |
| `LOG_LEVEL` | `debug`, `info`, `warn` or `error` (JSON logs on stdout) | `info` | no (default info) |
| `TZ` | Time zone used for the working-day rule (Sunday is skipped in Vietnam time) | `Asia/Ho_Chi_Minh` | no |
| `DATABASE_URL` | Connection string, used only when running with `npm` instead of Docker | `postgres://l4_user:change_me@localhost:5432/l4_dev` | only for `npm` |
| `PORT`, `NODE_ENV` | Set by the container (`3000`, `production`); keep as is | – | no |

`DATABASE_URL` and `TEST_DATABASE_URL` inside the container are built by `docker-compose.yml` from `DB_*`; you do not set them. The test database is named `<DB_NAME>_test` and is created automatically the first time the tests run. `JWT_SECRET` is the only authentication variable (login is prototype-level, TD-34).

## 4. Sample data

Loaded automatically on the first start (and re-checked on every start) from `seeds/`. After it finishes you should have:

| Data | Count |
|---|---|
| Technicians | 38 |
| Technician skills | 159 |
| Sample login accounts | 7 (`admin` for all centers, `quanly_tt1` … `quanly_tt6` for one center each); shared sample password `Mekong@2026` (demo data, stored only as scrypt hashes) |
| Customers | 1,063 |
| Open warranty tickets | 1,098, of which **12** are unassigned (status `MOI`) |

To compare with your own run, the quickest check is the unassigned-ticket list (see step 3b of the next section): it must report `"total":12`.

## 5. Verify it works

Run these in order. On Windows PowerShell type `curl.exe`, not `curl` (in PowerShell `curl` is a different command).

| # | Command | Expected result |
|---|---|---|
| 1 | `docker compose ps` | Services `api` and `db` both show `(healthy)` (wait up to about 30 seconds after step 3 of Setup) |
| 2 | `curl.exe -s http://localhost:3000/health` | `{"status":"ok","db":"ok"}` |
| 3 | `curl.exe -s "http://localhost:3000/api/tickets/unassigned?limit=3"` | **401** `UNAUTHENTICATED`: every `/api` endpoint needs a token (this proves access control is on) |
| 3b | `$t = (curl.exe -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"Mekong@2026\"}' \| ConvertFrom-Json).token` then `curl.exe -s -H "Authorization: Bearer $t" "http://localhost:3000/api/tickets/unassigned?limit=3"` | Login returns a token; the list returns JSON with `"total":12` and 3 items in `items` |
| 4 | Open `http://localhost:3000` in a browser and sign in as `admin` / `Mekong@2026` | The ticket list page shows 12 unassigned tickets; a wrong password shows "Tên đăng nhập hoặc mật khẩu không đúng." |
| 5 | `docker compose exec api npm test` | The summary ends with `tests 168`, `pass 168`, `fail 0`, `skipped 0` |
| 5b | `docker compose exec api npm run tc -- TC-05` (any code from TC-01 to TC-14) | Runs only that test case and ends with `pass 1`, `fail 0`; the case list is in `docs/test-report.md` |
| 6 | `docker compose run --rm api node src/db/runner.js seeds`, then repeat step 3b | The seed runs again without errors (`seeds: xong`) and step 3b still reports `"total":12`: running it twice does not duplicate data |

If the application opens but a list is empty, the sample data did not load: run `docker compose logs api --tail 50` and look for lines starting with `seeds:`.

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Another program uses port 3000 | Set `API_PORT=3001` in `.env`, run `docker compose up -d` again, and use port 3001 in the URLs |
| `curl: (52) Empty reply from server` right after `up` | The API is still starting | Wait about 10 seconds and retry; `docker compose ps` must show `healthy` |
| An old volume holds a different password (`password authentication failed`) | The database volume was created with earlier values | `docker compose down -v`, then `docker compose up -d --build` |
| Error text shows an unreadable lookup code | Normal: the server returns a reference code instead of internal details | Search the logs for it: `docker compose logs api --tail 100` (the code is the `requestId`) |

## 7. Going to production (HTTPS and access)

The application serves plain HTTP and does **not** terminate TLS. For a real deployment:

- Put it behind a reverse proxy (for example nginx or Caddy) that holds the TLS certificate, and do not publish port 3000 directly.
- The system has a prototype-level login (JWT, scrypt-hashed passwords, per-center access). Before any real use: replace `JWT_SECRET`, delete or change the 7 sample accounts in `seeds/005_app_users.sql` (their shared password `Mekong@2026` is public in this repository), and serve it only over HTTPS. There is no password change or token revocation yet.
- Never reuse the sample `DB_PASSWORD`; set secrets through the hosting platform's environment settings, not in the repository.
- Keep the database port unpublished (as in `docker-compose.yml`).

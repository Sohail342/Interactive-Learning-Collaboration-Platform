# Learning & Collaboration Platform

React frontend, FastAPI backend, and a self-hosted open-source LiveKit server. PostgreSQL and Redis run in Docker Compose. Each app has its own `.env`, so the frontend and backend can also run on the host while Compose provides the infrastructure.

Architecture notes live in [docs/README.md](docs/README.md).

## Layout

```
docker-compose.yml
.env.example
livekit/livekit.yaml
docs/
frontend/
  Dockerfile
  .env.example
  src/
backend/
  Dockerfile
  .env.example
  app/
```

## Environment files

Copy the examples once. The copied `.env` files stay untracked.

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

| File | Used by |
| --- | --- |
| `.env` | Compose interpolation for Postgres user, password, and database name |
| `backend/.env` | `uvicorn` on the host. Compose loads this file, then overrides `DATABASE_URL`, `REDIS_URL`, and `LIVEKIT_HTTP_URL` with service hostnames |
| `frontend/.env` | Vite on the host and the frontend container. URLs stay on `localhost` because the browser runs on the host |

LiveKit's dev key pair in `livekit/livekit.yaml` is `devkey` / `secret`, matching `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.

## Run the full stack

From the repository root, after the env files exist:

```powershell
docker compose up --build
```

| Service | Address on the host |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Backend readiness | http://localhost:8000/health/ready |
| LiveKit signaling | ws://localhost:7880 |
| LiveKit TCP ICE | localhost:7881 |
| LiveKit UDP media | localhost:50000-50050 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

`GET /health` returns the process status. `GET /health/ready` checks PostgreSQL and Redis.

## Run the apps on the host

Start infrastructure only:

```powershell
docker compose up db redis livekit
```

Backend, from `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`backend/.env` points PostgreSQL, Redis, and LiveKit at `localhost`.

Frontend, from `frontend/`:

```powershell
npm install
npm run dev
```

`frontend/.env` sets `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_LIVEKIT_URL`.

## LiveKit on this machine

`livekit/livekit.yaml` sets `rtc.node_ip` to `127.0.0.1` and turns off external IP discovery, so a browser on this computer can reach the published media ports. For any other host, set `node_ip` to the address clients use to reach the machine. The UDP range is 50000-50050 so Docker on Windows does not publish thousands of ports.
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
  collabaration_app/
```

## Setup (step by step)

### 1. Prerequisites

Install these first:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- PowerShell (Windows)
- Optional for host development: Python 3.13+, Node.js 22+, and [uv](https://docs.astral.sh/uv/)

**Why Docker is required:** this platform needs **Redis** for realtime features (chat, whiteboard sync, and related Socket.IO state). Redis is a Linux-oriented server and is **not truly compatible with Windows** as a native install, so Compose runs Redis (and PostgreSQL / LiveKit) in containers. That keeps local setup reliable on Windows without trying to run Redis natively.

### 2. Copy environment files

From the repository root, copy the example env files once. The copied `.env` files stay untracked.

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

| File | Used by |
| --- | --- |
| `.env` | Compose interpolation for Postgres user, password, and database name |
| `backend/.env` | Backend settings. Compose loads this file, then overrides `DATABASE_URL`, `REDIS_URL`, and `LIVEKIT_HTTP_URL` with Docker service hostnames |
| `frontend/.env` | Vite on the host and the frontend container. URLs stay on `localhost` because the browser runs on the host |

LiveKit's dev key pair in `livekit/livekit.yaml` is `devkey` / `secret`, matching `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in `backend/.env`. You can leave those defaults for local development.

### 3. Optional: ElevenLabs text-to-speech API key

The `/tts` page works without any key using the **browser** Speech Synthesis API.

To use **ElevenLabs** voices instead, create a free API key and put it in `backend/.env`:

1. Open [https://elevenlabs.io](https://elevenlabs.io) and sign up with **Google** or **email**.
2. After login, go to [https://elevenlabs.io/app/developers/api-keys](https://elevenlabs.io/app/developers/api-keys).
3. Click **Create API Key**.
4. Give the key a name if asked.
5. Turn **Restrict Key** **off** (if Restrict Key stays on, voice list and speak calls can fail).
6. Click **Create**, then **copy** the key immediately (you may not see it again).
7. Open `backend/.env` and set:

```env
ELEVENLABS_API_KEY=paste_your_key_here
```

8. Save the file. If the stack is already running, restart the backend so it reloads the key:

```powershell
docker compose restart backend
```

Notes:

- Leave `ELEVENLABS_API_KEY` empty to keep using browser voices.
- On a free ElevenLabs plan, only **premade** voices are listed. Library voices need a paid plan and are filtered out automatically.

### 4. Start the full stack

From the repository root (after the env files exist):

```powershell
docker compose up --build
```

Wait until the containers are healthy / started, then open:

| What | URL |
| --- | --- |
| App (frontend) | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Backend readiness | http://localhost:8000/health/ready |

Other local ports:

| Service | Address on the host |
| --- | --- |
| LiveKit signaling | ws://localhost:7880 |
| LiveKit TCP ICE | localhost:7881 |
| LiveKit UDP media | localhost:50000-50050 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

`GET /health` returns the process status. `GET /health/ready` checks PostgreSQL and Redis.

### 5. Use the app

1. Open http://localhost:5173
2. Register a **teacher** and/or **student** account
3. Teacher: create a meeting, start it, share the meeting ID
4. Student: join with the meeting ID
5. Open **Text to speech** from either home page (`/tts`) to try browser or ElevenLabs voices

To stop the stack:

```powershell
docker compose down
```

## Run the apps on the host (optional)

Use this when you want to edit backend/frontend outside Docker while keeping databases and LiveKit in Compose.

### 1. Start infrastructure only

```powershell
docker compose up db redis livekit
```

### 2. Backend (from `backend/`)

```powershell
uv sync
uv run uvicorn collabaration_app.main:app --reload --port 8000
```

`backend/.env` should point PostgreSQL, Redis, and LiveKit at `localhost` (as in `.env.example`).

### 3. Frontend (from `frontend/`)

```powershell
npm install
npm run dev
```

`frontend/.env` sets `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_LIVEKIT_URL`.

## LiveKit on this machine

`livekit/livekit.yaml` sets `rtc.node_ip` to `127.0.0.1` and turns off external IP discovery, so a browser on this computer can reach the published media ports. For any other host, set `node_ip` to the address clients use to reach the machine. The UDP range is 50000-50050 so Docker on Windows does not publish thousands of ports.

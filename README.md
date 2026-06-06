# Backend Service

Game recommendation API backend using Effect-TS.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1` | Service info |
| GET | `/api/v1/healthcheck` | Health check |
| GET | `/api/v1/recommend` | Recommend by title (query: `judul`, `topN`) |
| POST | `/api/v1/recommend` | Recommend by query (body: `query`, `topN`) |

## Usage

```bash
# Info service
curl http://localhost:8989/api/v1

# Health check
curl http://localhost:8989/api/v1/healthcheck

# Rekomendasi berdasarkan judul game
curl "http://localhost:8989/api/v1/recommend?judul=Genshin%20Impact&topN=5"

# Rekomendasi berdasarkan query natural language
curl -X POST http://localhost:8989/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "game santai buat dimainkan bareng teman", "topN": 3}'
```

## Run

```bash
bun run src/index.ts           # development
bun build src/index.ts --target=bun --outdir=dist && bun run dist/index.js  # production
docker compose up --build      # docker
```

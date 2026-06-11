# Gamu Backend

Game recommendation API backend for the GamU system. GamU is an LLM-based game recommendation system that enables users to discover games through natural language queries. The backend orchestrates LLM-driven preference extraction, recommendation candidate retrieval, and personalized explanation generation.

## Features

- **Natural language game search**: Users describe preferences in plain language (e.g., "relaxing games to play with friends") and receive tailored recommendations with contextual explanations.
- **LLM-powered personalized explanations**: Generates engaging, individualized descriptions for each recommendation using Gemini as the primary model with OpenRouter as a fallback, with response caching to reduce latency.
- **Dual recommendation modes**: Supports both title-based similarity lookup and query-based recommendation through the ML inference service.

## Tech Stack

| Component          | Technology                                                   |
| ------------------ | ------------------------------------------------------------ |
| Runtime            | Bun                                                          |
| Language           | TypeScript (strict mode)                                     |
| Core Framework     | Effect (@effect/platform, @effect/schema)                   |
| HTTP Server        | @effect/platform-node                                        |
| LLM Integration    | @effect/ai-google (Gemini 3.1 Flash Lite), @effect/ai-openai (OpenRouter fallback) |
| Data Storage       | JSON files (game data + similarity lookup)                   |
| Validation         | @effect/schema (schemas, TaggedError domain errors)          |
| Containerization   | Docker (oven/bun:1)                                          |
| ML Service         | External Flask-based inference service (TF-IDF + cosine similarity) |

## Project Structure

```
src/
  config/          Environment configuration with Effect Config
  data/            Game data and similarity lookup loading
  http/
    app.ts         Router definition
    handlers/      Request handlers (health, recommend, recommend-query, root)
    middleware/    Rate limiting (60 requests per minute per IP)
    schemas.ts     Request validation schemas
  lib/             Shared utilities (errors, response helpers, schemas)
  modules/
    llm/           LLM service, cache, prompt builder
    recommendation/ Recommendation service, query service, pipeline
  index.ts         Server entry point
  layer.ts         Dependency injection layer composition
```

## Getting Started

### Prerequisites

- Bun 1.x or later
- A Google AI API key (for Gemini)
- An OpenRouter API key (for the fallback LLM model)
- The ML inference service running and accessible (see `ML_SERVICE_URL`)
- Game data files in the `data/` directory:
  - `games_data.json`
  - `similarity_lookup.json`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/GamU-Labs/backend-service.git
   cd backend-service
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Create the environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and provide the required values:
   ```
   DATABASE_URL=sqlite://:memory:
   GOOGLE_AI_KEY=<your-google-ai-key>
   ROUTER_API_KEY=<your-openrouter-api-key>
   ROUTER_BASE_URL=http://9r.xx.my.id/v1
   ROUTER_MODEL=agentrouter/glm-5.1
   ML_SERVICE_URL=http://localhost:5001
   PORT=8989
   CORS_ORIGINS=http://localhost:3002
   ```

### Running

Development mode (with file watcher):
```bash
bun run dev
```

Production build and run:
```bash
bun run build
bun run start
```

Docker:
```bash
docker compose up --build
```

## API Endpoints

| Method | Path                  | Description                                        |
| ------ | --------------------- | -------------------------------------------------- |
| GET    | `/api/v1`             | Service info                                       |
| GET    | `/api/v1/healthcheck` | Health check                                       |
| GET    | `/api/v1/recommend`   | Recommend by game title (query: `judul`, `topN`)   |
| POST   | `/api/v1/recommend`   | Recommend by natural language query (body: `query`, `topN`) |

## Usage Examples

Service info:
```bash
curl http://localhost:8989/api/v1
```

Health check:
```bash
curl http://localhost:8989/api/v1/healthcheck
```

Recommendation by game title:
```bash
curl "http://localhost:8989/api/v1/recommend?judul=Genshin%20Impact&topN=5"
```

Recommendation by natural language query:
```bash
curl -X POST http://localhost:8989/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "game santai buat dimainkan bareng teman", "topN": 3}'
```

## Architecture Overview

The recommendation pipeline follows this flow:

1. The user submits a game title or a natural language query.
2. For title-based requests, the system looks up precomputed similarity data. For query-based requests, it forwards the query to the ML inference service which returns candidates using TF-IDF and cosine similarity.
3. The system constructs a structured prompt containing the candidate games and the user's input, then sends it to the LLM.
4. Gemini is attempted first. If it fails or times out (10-second limit), the OpenRouter fallback model is used.
5. LLM responses are cached (30-minute TTL, 100-entry capacity) to reduce redundant calls for identical title and topN combinations.
6. The API returns the recommendation candidates along with the LLM-generated explanation.

All domain errors use Effect's `Schema.TaggedError` pattern, and all validation uses `@effect/schema` with no type casts or raw `Error` usage.

## Environment Variables

| Variable          | Description                            | Default                    |
| ----------------- | -------------------------------------- | -------------------------- |
| `DATABASE_URL`    | SQLite connection string               | `sqlite://:memory:`        |
| `GOOGLE_AI_KEY`   | Google AI API key for Gemini           | (required)                 |
| `ROUTER_API_KEY`  | OpenRouter API key for fallback LLM    | (required)                 |
| `ROUTER_BASE_URL` | OpenRouter API base URL                | `http://9r.xx.my.id/v1`    |
| `ROUTER_MODEL`    | OpenRouter model identifier            | `agentrouter/glm-5.1`      |
| `ML_SERVICE_URL`  | ML inference service URL               | `http://localhost:5001`    |
| `PORT`            | HTTP server port                       | `8989`                     |
| `CORS_ORIGINS`    | Comma-separated allowed CORS origins   | `http://localhost:3002`    |

## Available Scripts

| Command               | Description                         |
| --------------------- | ----------------------------------- |
| `bun run dev`         | Start development server with watch |
| `bun run build`       | Build for production                |
| `bun run start`       | Run production build                |
| `bun run format`      | Format code with Prettier           |
| `bun run format:check` | Check formatting with Prettier      |
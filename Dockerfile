FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src
COPY data ./data

RUN bun build src/index.ts --target=bun --outdir=dist

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data

EXPOSE 8989

ENV NODE_ENV=production

CMD ["bun", "run", "dist/index.js"]

import { HttpServer, HttpMiddleware } from '@effect/platform'
import { NodeContext, NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { createServer } from 'node:http'

import { AppConfig } from './config/config.js'
import { buildAppRouter } from './http/app.js'
import { rateLimitMiddleware } from './http/middleware/rate-limit.js'
import { AppLayer } from './layer.js'

const corsMiddleware = HttpMiddleware.cors({
	allowedOrigins: ['http://localhost:3002'],
	allowedMethods: ['GET', 'POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
})

const ServerLayer = (config: AppConfig) =>
	HttpServer.serve(buildAppRouter().pipe(rateLimitMiddleware).pipe(corsMiddleware)).pipe(
		Layer.provide(AppLayer),
		Layer.provide(NodeHttpServer.layer(createServer, { port: config.port })),
	)

const main = Effect.gen(function* () {
	const config = yield* AppConfig
	yield* Effect.logInfo(
		`Starting server on port ${config.port} (router model: ${config.routerModel})`,
	)

	yield* Layer.launch(ServerLayer(config))
})

Effect.runPromise(Effect.provide(main, AppLayer.pipe(Layer.provideMerge(NodeContext.layer)))).catch(
	console.error,
)

// @see https://github.com/GamU-Labs/backend-service

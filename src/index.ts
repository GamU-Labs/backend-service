import { HttpServer } from '@effect/platform'
import { NodeContext, NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { createServer } from 'node:http'

import { AppConfig } from './config/config.js'
import { buildAppRouter } from './http/app.js'
import { AppLayer } from './layer.js'

const main = Effect.gen(function* () {
	const config = yield* AppConfig
	yield* Effect.logInfo(
		`Starting server on port ${config.port} (router model: ${config.routerModel})`,
	)

	const serverLayer = HttpServer.serve(buildAppRouter()).pipe(
		Layer.provide(NodeHttpServer.layer(createServer, { port: config.port })),
	)

	yield* Layer.launch(serverLayer.pipe(Layer.provide(AppLayer)))
})

Effect.runPromise(
	Effect.provide(main, AppLayer.pipe(Layer.provideMerge(NodeContext.layer))),
).catch(console.error)

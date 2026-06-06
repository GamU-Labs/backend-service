import { HttpServer } from '@effect/platform'
import { NodeContext, NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { createServer } from 'node:http'

import { AppConfig, ConfigLayer } from './config/config.js'
import { buildAppRouter } from './http/app.js'
import { LLMServiceLive } from './modules/llm/llm.service.js'
import { RecommendationServiceLive } from './modules/recommendation/recommendation.service.js'

const AppLayer = Layer.merge(RecommendationServiceLive, LLMServiceLive).pipe(
	Layer.provideMerge(ConfigLayer),
	Layer.provideMerge(NodeContext.layer),
)

const main = Effect.gen(function* () {
	const config = yield* AppConfig
	yield* Effect.logInfo(`Memulai server di port ${config.port} (router model: ${config.routerModel})`)

	const serverLayer = HttpServer.serve(buildAppRouter()).pipe(
		Layer.provide(NodeHttpServer.layer(createServer, { port: config.port })),
	)

	yield* Layer.launch(serverLayer.pipe(Layer.provide(AppLayer)))
})

Effect.runPromise(Effect.provide(main, AppLayer)).catch(console.error)

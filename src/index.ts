import { Effect, Layer } from 'effect'
import { NodeContext } from '@effect/platform-node'

import { AppConfig, ConfigLayer } from './config/config.js'
import { buildPrompt } from './modules/llm/prompt.js'
import { LLMService, LLMServiceLive } from './modules/llm/llm.service.js'
import { RecommendationService, RecommendationServiceLive } from './modules/recommendation/recommendation.service.js'

const pipeline = (title: string, topN: number) =>
	Effect.gen(function* () {
		const recService = yield* RecommendationService
		const llmService = yield* LLMService

		const recs = yield* recService.recommend(title, topN)
		const prompt = buildPrompt(title, recs.recommendations)
		const llmResponse = yield* llmService.generateResponse(prompt)

		return { inputGame: title, recommendations: recs.recommendations, llmResponse }
	})

const AppLayer = Layer.merge(RecommendationServiceLive, LLMServiceLive).pipe(
	Layer.provideMerge(ConfigLayer),
	Layer.provideMerge(NodeContext.layer),
)

const program = Effect.gen(function* () {
	const config = yield* AppConfig
	yield* Effect.logInfo(`Backend service ready (router model: ${config.routerModel})`)

	const result = yield* pipeline('Prince of Persia: Warrior Within™', 3)
	yield* Effect.logInfo(`Recommendations: ${result.recommendations.length}`)
	yield* Effect.logInfo(`LLM response: ${result.llmResponse.slice(0, 100)}...`)
})

Effect.runPromise(program.pipe(Effect.provide(AppLayer)))

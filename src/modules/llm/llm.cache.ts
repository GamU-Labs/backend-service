import { Cache, Context, Duration, Effect, Layer } from 'effect'
import { LLMService } from './llm.service.js'
import { buildPrompt } from './prompt.js'
import { RecommendationService } from '../recommendation/recommendation.service.js'
import { GameNotFoundError, LlmError, ModelNotLoadedError } from '../../lib/errors.js'

export interface LlmCacheService {
	readonly get: (title: string, topN: number) => Effect.Effect<string, LlmError>
}

export const LlmCacheService = Context.GenericTag<LlmCacheService>('LlmCacheService')

const makeKey = (title: string, topN: number) => `${title.toLowerCase()}:${topN}`

const handleCacheError = (error: GameNotFoundError | ModelNotLoadedError): LlmError =>
	new LlmError({
		message:
			error instanceof GameNotFoundError
				? `Game not found: ${error.title}`
				: 'Model not loaded',
	})

export const LlmCacheServiceLive = Layer.effect(
	LlmCacheService,
	Effect.gen(function* () {
		const llm = yield* LLMService
		const recService = yield* RecommendationService

		const cache = yield* Cache.make({
			capacity: 100,
			timeToLive: Duration.minutes(30),
			lookup: (key: string) =>
				Effect.gen(function* () {
					const separatorIndex = key.indexOf(':')
					const normalizedTitle = key.slice(0, separatorIndex)
					const topN = parseInt(key.slice(separatorIndex + 1), 10)

					const recs = yield* recService
						.recommend(normalizedTitle, topN)
						.pipe(Effect.mapError(handleCacheError))
					const prompt = buildPrompt(normalizedTitle, recs.recommendations)
					return yield* llm.generateResponse(prompt)
				}),
		})

		return {
			get: (title: string, topN: number) => cache.get(makeKey(title, topN)),
		}
	}),
)

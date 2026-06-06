import { Effect, Option } from 'effect'

import { type SimilarityEntry } from '../../data/games.js'
import { LlmCacheService } from '../llm/llm.cache.js'
import { RecommendationService } from './recommendation.service.js'

export interface PipelineResult {
	readonly inputGame: string
	readonly recommendations: ReadonlyArray<SimilarityEntry>
	readonly llmResponse: Option.Option<string>
}

export const pipeline = (title: string, topN: number) =>
	Effect.gen(function* () {
		const recService = yield* RecommendationService
		const llmCache = yield* LlmCacheService

		yield* Effect.logInfo(`pipeline: looking up recommendations for "${title}"`)

		const recs = yield* recService.recommend(title, topN)

		yield* Effect.logInfo(
			`pipeline: found ${recs.recommendations.length} recommendations, checking LLM cache`,
		)

		const llmResponse = yield* Effect.option(llmCache.get(title, topN))

		if (Option.isSome(llmResponse)) {
			yield* Effect.logInfo(`pipeline: LLM responded (${llmResponse.value.length} chars)`)
		} else {
			yield* Effect.logWarning(
				`pipeline: LLM failed, returning recommendations without LLM response`,
			)
		}

		const result: PipelineResult = {
			inputGame: title,
			recommendations: recs.recommendations,
			llmResponse,
		}
		return result
	})

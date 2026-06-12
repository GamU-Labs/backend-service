import { Effect, Option } from 'effect'

import { type SimilarityEntry } from '../../data/games.js'
import { type LlmExplanation } from '../../lib/schemas.js'
import { LlmCacheService } from '../llm/llm.cache.js'
import { RecommendationService } from './recommendation.service.js'
import { SteamImageService } from '../steam/steam-image.service.js'

export interface EnrichedRecommendation extends SimilarityEntry {
	readonly header_image: string
}

export interface PipelineResult {
	readonly inputGame: string
	readonly recommendations: ReadonlyArray<EnrichedRecommendation>
	readonly llmResponse: Option.Option<LlmExplanation>
}

export const pipeline = (title: string, topN: number) =>
	Effect.gen(function* () {
		const recService = yield* RecommendationService
		const llmCache = yield* LlmCacheService
		const steamImage = yield* SteamImageService

		yield* Effect.logInfo(`pipeline: looking up recommendations for "${title}"`)

		const recs = yield* recService.recommend(title, topN)

		yield* Effect.logInfo(
			`pipeline: found ${recs.recommendations.length} recommendations, fetching images`,
		)

		const imageMap = yield* Effect.catchAll(steamImage.getImages(recs.recommendations), (e) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`pipeline: steam image fetch failed: ${e.message}`)
				return new Map<number, { header_image: string }>()
			}),
		)

		const enriched: ReadonlyArray<EnrichedRecommendation> = recs.recommendations.map((r) => ({
			...r,
			header_image: imageMap.get(r.app_id)?.header_image ?? '',
		}))

		yield* Effect.logInfo(`pipeline: images enriched, checking LLM cache`)

		const llmResponse = yield* Effect.option(llmCache.get(title, topN))

		if (Option.isSome(llmResponse)) {
			yield* Effect.logInfo(
				`pipeline: LLM responded (${llmResponse.value.highlights.length} highlights)`,
			)
		} else {
			yield* Effect.logWarning(
				`pipeline: LLM failed, returning recommendations without LLM response`,
			)
		}

		const result: PipelineResult = {
			inputGame: title,
			recommendations: enriched,
			llmResponse,
		}
		return result
	})

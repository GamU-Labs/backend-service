import { Effect } from 'effect'

import { type SimilarityEntry } from '../../data/games.js'
import { buildPrompt } from '../llm/prompt.js'
import { LLMService } from '../llm/llm.service.js'
import { RecommendationService } from './recommendation.service.js'

export interface PipelineResult {
	readonly inputGame: string
	readonly recommendations: ReadonlyArray<SimilarityEntry>
	readonly llmResponse: string
}

export const pipeline = (title: string, topN: number) =>
	Effect.gen(function* () {
		const recService = yield* RecommendationService
		const llmService = yield* LLMService

		yield* Effect.logInfo(`pipeline: looking up recommendations for "${title}"`)

		const recs = yield* recService.recommend(title, topN)

		yield* Effect.logInfo(`pipeline: found ${recs.recommendations.length} recommendations, calling LLM`)

		const prompt = buildPrompt(title, recs.recommendations)
		const llmResponse = yield* llmService.generateResponse(prompt)

		yield* Effect.logInfo(`pipeline: LLM responded (${llmResponse.length} chars)`)

		const result: PipelineResult = {
			inputGame: title,
			recommendations: recs.recommendations,
			llmResponse,
		}
		return result
	})

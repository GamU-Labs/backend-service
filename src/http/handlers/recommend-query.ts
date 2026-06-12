import { HttpServerRequest } from '@effect/platform'
import { Effect, Option, Schema, ParseResult } from 'effect'

import { MLServiceError, InvalidInputError, SanitizeInputError } from '../../lib/errors.js'
import { appResponseSuccess, appResponseError } from '../../lib/response.js'
import { RecommendByQueryResponse } from '../../lib/schemas.js'
import { RecommendByQueryBodySchema } from '../schemas.js'
import { RecommendationQueryService } from '../../modules/recommendation/recommendation-query.service.js'
import type { SimilarityEntry } from '../../data/games.js'
import { LLMService } from '../../modules/llm/llm.service.js'
import { buildQueryPrompt } from '../../modules/llm/prompt.js'
import { SteamImageService } from '../../modules/steam/steam-image.service.js'
import { sanitizeQuery } from '../../lib/sanitize.js'

export const recommendByQueryHandler = Effect.gen(function* () {
	const body = yield* HttpServerRequest.schemaBodyJson(RecommendByQueryBodySchema).pipe(
		Effect.catchAll((e) => Effect.fail(new InvalidInputError({ detail: e.message }))),
	)

	const sanitizedQuery = yield* sanitizeQuery(body.query)

	yield* Effect.logInfo(`recommend by query: query="${sanitizedQuery}", topN=${body.topN}`)

	const queryService = yield* RecommendationQueryService
	const llm = yield* LLMService

	const result = yield* queryService.recommendByQuery(sanitizedQuery, body.topN)

	const steamImage = yield* SteamImageService
	const imageMap = yield* Effect.catchAll(steamImage.getImages(result.recommendations), (e) =>
		Effect.gen(function* () {
			yield* Effect.logWarning(`recommend-query: steam image fetch failed: ${e.message}`)
			return new Map<number, { header_image: string }>()
		}),
	)

	const recommendations = result.recommendations.map((r: SimilarityEntry) => ({
		app_id: r.app_id,
		title: r.title,
		rating: r.rating ? parseFloat(r.rating) : 0,
		desc_sentence: r.desc_sentence,
		tags_clean: r.tags_clean,
		similarity_score: r.similarity_score,
		header_image: imageMap.get(r.app_id)?.header_image ?? '',
	}))

	const prompt = buildQueryPrompt(sanitizedQuery, result.recommendations)
	const llmResponse = yield* Effect.option(llm.generateStructuredResponse(prompt))

	if (Option.isSome(llmResponse)) {
		yield* Effect.logInfo(
			`recommend query success: "${sanitizedQuery}", ${result.recommendations.length} recommendations, LLM responded`,
		)
	} else {
		yield* Effect.logWarning(
			`recommend query success: "${sanitizedQuery}", ${result.recommendations.length} recommendations, LLM failed`,
		)
	}

	const responseBody = {
		message: 'Game recommendation generated successfully',
		data: {
			query: result.query,
			status: 'success' as const,
			recommendations,
			llm_response: Option.isSome(llmResponse) ? llmResponse.value : null,
		},
	}

	const encoded = yield* Schema.encode(RecommendByQueryResponse)(responseBody)
	return yield* appResponseSuccess(encoded.data, encoded.message)
}).pipe(
	Effect.catchTags({
		SanitizeInputError: (e: SanitizeInputError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend query sanitize error: ${e.detail}`)
				return yield* appResponseError(400, e.detail, 'SanitizeInputError')
			}),
		MLServiceError: (e: MLServiceError) =>
			Effect.gen(function* () {
				yield* Effect.logError(`ML service error: ${e.message}`)
				return yield* appResponseError(503, e.message, 'MLServiceError')
			}),
		InvalidInputError: (e: InvalidInputError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend query bad request: ${e.detail}`)
				return yield* appResponseError(400, e.detail, 'InvalidInputError')
			}),
		ParseError: (e: ParseResult.ParseError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend query schema error: ${e.message}`)
				return yield* appResponseError(500, 'Internal response error', 'InternalError')
			}),
	}),
)

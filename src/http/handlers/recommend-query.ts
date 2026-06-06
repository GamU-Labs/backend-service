import { HttpServerRequest } from '@effect/platform'
import { Effect, Option, Schema, ParseResult } from 'effect'

import { MLServiceError, InvalidInputError } from '../../lib/errors.js'
import { appResponseSuccess, appResponseError } from '../../lib/response.js'
import { RecommendByQueryResponse } from '../../lib/schemas.js'
import { RecommendByQueryBodySchema } from '../schemas.js'
import { RecommendationQueryService } from '../../modules/recommendation/recommendation-query.service.js'
import type { SimilarityEntry } from '../../data/games.js'
import { LLMService } from '../../modules/llm/llm.service.js'
import { buildQueryPrompt } from '../../modules/llm/prompt.js'

export const recommendByQueryHandler = Effect.gen(function* () {
	const body = yield* HttpServerRequest.schemaBodyJson(RecommendByQueryBodySchema).pipe(
		Effect.catchAll((e) =>
			Effect.fail(new InvalidInputError({ detail: e.message })),
		),
	)

	yield* Effect.logInfo(`recommend by query: query="${body.query}", topN=${body.topN}`)

	const queryService = yield* RecommendationQueryService
	const llm = yield* LLMService

	const result = yield* queryService.recommendByQuery(body.query, body.topN)

	const recommendations = result.recommendations.map((r: SimilarityEntry) => ({
		title: r.title,
		rating: r.rating ? parseFloat(r.rating) : 0,
		desc_sentence: r.desc_sentence,
		tags_clean: r.tags_clean,
		similarity_score: r.similarity_score,
	}))

	const prompt = buildQueryPrompt(body.query, result.recommendations)
	const llmResponse = yield* Effect.option(llm.generateResponse(prompt))

	if (Option.isSome(llmResponse)) {
		yield* Effect.logInfo(
			`recommend query success: "${body.query}", ${result.recommendations.length} recommendations, LLM responded`,
		)
	} else {
		yield* Effect.logWarning(
			`recommend query success: "${body.query}", ${result.recommendations.length} recommendations, LLM failed`,
		)
	}

	const responseBody = {
		message: 'Game recommendation generated successfully',
		data: {
			query: result.query,
			status: 'success' as const,
			recommendations,
			llm_response: Option.getOrElse(llmResponse, () => null),
		},
	}

	const encoded = yield* Schema.encode(RecommendByQueryResponse)(responseBody)
	return yield* appResponseSuccess(encoded.data, encoded.message)
}).pipe(
	Effect.catchTags({
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

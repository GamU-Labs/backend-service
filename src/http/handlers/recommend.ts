import { HttpServerRequest, HttpServerResponse } from '@effect/platform'
import { Effect, ParseResult } from 'effect'

import { LlmError } from '../../modules/llm/llm.service.js'
import { pipeline } from '../../modules/recommendation/pipeline.js'
import { GameNotFoundError, ModelNotLoadedError } from '../../modules/recommendation/recommendation.service.js'
import { RecommendQuerySchema } from '../schemas.js'

export const recommendHandler = Effect.gen(function* () {
	const query = yield* HttpServerRequest.schemaSearchParams(RecommendQuerySchema)
	yield* Effect.logInfo(`recommend request: title="${query.judul}", topN=${query.topN}`)

	const result = yield* pipeline(query.judul, query.topN)

	yield* Effect.logInfo(`recommend success: title="${query.judul}", ${result.recommendations.length} recommendations`)

	return yield* HttpServerResponse.json({
		status: 'success',
		input_game: result.inputGame,
		recommendations: result.recommendations,
		llm_response: result.llmResponse,
	})
}).pipe(
	Effect.catchTags({
		GameNotFoundError: (e: GameNotFoundError) => {
			return Effect.gen(function* () {
				yield* Effect.logWarning(`recommend game not found: "${e.title}"`)
				return yield* HttpServerResponse.json(
					{ status: 'error', code: 'GAME_NOT_FOUND', message: e.message },
					{ status: 404 },
				)
			})
		},
		ModelNotLoadedError: (e: ModelNotLoadedError) => {
			return Effect.gen(function* () {
				yield* Effect.logError(`recommend model not loaded: ${e.message}`)
				return yield* HttpServerResponse.json(
					{ status: 'error', code: 'MODEL_NOT_LOADED', message: e.message },
					{ status: 500 },
				)
			})
		},
		LlmError: (e: LlmError) => {
			return Effect.gen(function* () {
				yield* Effect.logError(`recommend LLM error: ${e.message}${e.cause ? ` (cause: ${e.cause})` : ''}`)
				return yield* HttpServerResponse.json(
					{ status: 'error', code: 'LLM_ERROR', message: e.message },
					{ status: 500 },
				)
			})
		},
		ParseError: (e: ParseResult.ParseError) => {
			return Effect.gen(function* () {
				yield* Effect.logWarning(`recommend bad request: ${e.message}`)
				return yield* HttpServerResponse.json(
					{
						status: 'error',
						code: 'BAD_REQUEST',
						message: 'Parameter query is invalid',
						details: e.message,
					},
					{ status: 400 },
				)
			})
		},
	}),
)

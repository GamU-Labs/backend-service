import { HttpServerRequest } from '@effect/platform'
import { Effect, ParseResult, Schema } from 'effect'

import {
	GameNotFoundError,
	InvalidInputError,
	LlmError,
	ModelNotLoadedError,
} from '../../lib/errors.js'
import { appResponseSuccess, appResponseError } from '../../lib/response.js'
import { RecommendResponse } from '../../lib/schemas.js'
import { pipeline } from '../../modules/recommendation/pipeline.js'
import { RecommendQuerySchema } from '../schemas.js'

export const recommendHandler = Effect.gen(function* () {
	const query = yield* HttpServerRequest.schemaSearchParams(RecommendQuerySchema)
	yield* Effect.logInfo(`recommend request: title="${query.judul}", topN=${query.topN}`)

	const result = yield* pipeline(query.judul, query.topN)

	yield* Effect.logInfo(
		`recommend success: title="${query.judul}", ${result.recommendations.length} recommendations`,
	)

	const recommendations = result.recommendations.map((r) => ({
		title: r.title,
		rating: r.rating ? parseFloat(r.rating) : 0,
		desc_sentence: r.desc_sentence,
		tags_clean: r.tags_clean,
		similarity_score: r.similarity_score,
	}))

	const body = {
		message: 'Game recommendation generated successfully',
		data: {
			input_game: result.inputGame,
			status: 'success' as const,
			recommendations,
			llm_response: result.llmResponse,
		},
	}

	const encoded = yield* Schema.encode(RecommendResponse)(body)
	return yield* appResponseSuccess(encoded.data, encoded.message)
}).pipe(
	Effect.catchTags({
		GameNotFoundError: (e: GameNotFoundError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend game not found: "${e.title}"`)
				return yield* appResponseError(404, 'Game tidak ditemukan', 'GameNotFoundError', {
					title: e.title,
				})
			}),
		ModelNotLoadedError: (e: ModelNotLoadedError) =>
			Effect.gen(function* () {
				yield* Effect.logError(`recommend model not loaded: ${e.reason}`)
				return yield* appResponseError(503, 'Layanan data belum siap', 'ModelNotLoadedError', {
					reason: e.reason,
				})
			}),
		LlmError: (e: LlmError) =>
			Effect.gen(function* () {
				yield* Effect.logError(`recommend LLM error: ${e.message}`)
				return yield* appResponseError(
					502,
					'Gagal mendapatkan respon dari AI upstream',
					'LlmError',
					{ message: e.message },
				)
			}),
		InvalidInputError: (e: InvalidInputError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend invalid input: ${e.detail}`)
				return yield* appResponseError(
					400,
					"Input tidak valid atau parameter 'judul' kurang",
					'InvalidInputError',
					{ detail: e.detail },
				)
			}),
		ParseError: (e: ParseResult.ParseError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend bad request: ${e.message}`)
				return yield* appResponseError(
					400,
					"Input tidak valid atau parameter 'judul' kurang",
					'InvalidInputError',
					{ detail: e.message },
				)
			}),
	}),
)

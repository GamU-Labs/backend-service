import { HttpServerRequest } from '@effect/platform'
import { Effect, Option, ParseResult, Schema } from 'effect'

import { GameNotFoundError, ModelNotLoadedError, SanitizeInputError } from '../../lib/errors.js'
import { appResponseSuccess, appResponseError } from '../../lib/response.js'
import { RecommendResponse } from '../../lib/schemas.js'
import { pipeline } from '../../modules/recommendation/pipeline.js'
import { RecommendQuerySchema } from '../schemas.js'
import { sanitizeTitle } from '../../lib/sanitize.js'

export const recommendByTitleHandler = Effect.gen(function* () {
	const query = yield* HttpServerRequest.schemaSearchParams(RecommendQuerySchema)

	const sanitizedTitle = yield* sanitizeTitle(query.judul)

	yield* Effect.logInfo(`recommend request: title="${sanitizedTitle}", topN=${query.topN}`)

	const result = yield* pipeline(sanitizedTitle, query.topN)

	yield* Effect.logInfo(
		`recommend success: title="${sanitizedTitle}", ${result.recommendations.length} recommendations`,
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
			llm_response: Option.isSome(result.llmResponse) ? result.llmResponse.value : null,
		},
	}

	const encoded = yield* Schema.encode(RecommendResponse)(body)
	return yield* appResponseSuccess(encoded.data, encoded.message)
}).pipe(
	Effect.catchTags({
		SanitizeInputError: (e: SanitizeInputError) =>
			Effect.gen(function* () {
				yield* Effect.logWarning(`recommend sanitize error: ${e.detail}`)
				return yield* appResponseError(400, e.detail, 'SanitizeInputError')
			}),
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
				return yield* appResponseError(
					503,
					'Layanan data belum siap',
					'ModelNotLoadedError',
					{ reason: e.reason },
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

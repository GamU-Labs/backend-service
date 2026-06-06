import { Context, Effect, Layer, Schema } from 'effect'

import { AppConfig } from '../../config/config.js'
import { SimilarityEntrySchema } from '../../data/games.js'
import type { SimilarityEntry } from '../../data/games.js'
import { MLServiceError } from '../../lib/errors.js'

const MLRecommendResponseSchema = Schema.Struct({
	message: Schema.String,
	data: Schema.Struct({
		query: Schema.String,
		recommendations: Schema.Array(SimilarityEntrySchema),
		meta: Schema.Struct({
			latency_ms: Schema.Number,
		}),
	}),
})

export interface RecommendationQueryResult {
	readonly query: string
	readonly recommendations: ReadonlyArray<SimilarityEntry>
}

export interface RecommendationQueryService {
	readonly recommendByQuery: (
		query: string,
		topN: number,
	) => Effect.Effect<RecommendationQueryResult, MLServiceError>
}

export const RecommendationQueryService = Context.GenericTag<RecommendationQueryService>(
	'RecommendationQueryService',
)

export const RecommendationQueryServiceLive: Layer.Layer<
	RecommendationQueryService,
	never,
	AppConfig
> = Layer.effect(
	RecommendationQueryService,
	Effect.gen(function* () {
		const config = yield* AppConfig

		const recommendByQuery = (
			query: string,
			topN: number,
		): Effect.Effect<RecommendationQueryResult, MLServiceError> =>
			Effect.gen(function* () {
				const url = `${config.mlServiceUrl}/api/v1/recommend`

				const response = yield* Effect.tryPromise({
					try: () =>
						fetch(url, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ query, top_n: topN }),
						}),
					catch: (e) =>
						new MLServiceError({
							message: `Gagal terhubung ke ML service: ${(e as Error).message}`,
						}),
				})

				if (!response.ok) {
					const errorBody = yield* Effect.tryPromise({
						try: () => response.json() as Promise<{ message?: string }>,
						catch: () => ({} as { message?: string }),
					}).pipe(Effect.catchAll(() => Effect.succeed({ message: response.statusText })))
					return yield* Effect.fail(
						new MLServiceError({
							message: `ML service error (${response.status}): ${errorBody.message || response.statusText}`,
						}),
					)
				}

				const json = yield* Effect.tryPromise({
					try: () => response.json() as Promise<unknown>,
					catch: (e) =>
						new MLServiceError({
							message: `Gagal parse response ML service: ${(e as Error).message}`,
						}),
				})

				const decoded = yield* Schema.decodeUnknown(MLRecommendResponseSchema)(json).pipe(
					Effect.mapError(
						(e) =>
							new MLServiceError({
								message: `Response ML service tidak valid: ${e.message}`,
							}),
					),
				)

				return {
					query: decoded.data.query,
					recommendations: decoded.data.recommendations,
				}
			})

		const service: RecommendationQueryService = { recommendByQuery }
		return service
	}),
)

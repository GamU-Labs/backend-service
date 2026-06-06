import { Context, Effect, Layer } from 'effect'
import { GameDataLayer } from '../../data/games.js'
import type { SimilarityEntry } from '../../data/games.js'
import { GameNotFoundError, ModelNotLoadedError } from '../../lib/errors.js'

export interface RecommendationResult {
	readonly inputGame: string
	readonly recommendations: ReadonlyArray<SimilarityEntry>
}

export interface RecommendationService {
	readonly recommend: (
		title: string,
		topN: number,
	) => Effect.Effect<RecommendationResult, GameNotFoundError | ModelNotLoadedError>
}

export const RecommendationService = Context.GenericTag<RecommendationService>('RecommendationService')

export const RecommendationServiceLive: Layer.Layer<
	RecommendationService,
	never,
	GameDataLayer
> = Layer.effect(
	RecommendationService,
	Effect.gen(function* () {
		const dataLayer = yield* GameDataLayer
		const lookup = dataLayer.similarityLookup

		const service: RecommendationService = {
			recommend: (title: string, topN: number) =>
				Effect.gen(function* () {
					const key = title.toLowerCase()
					const results = lookup[key]

					if (!results) {
						return yield* Effect.fail(new GameNotFoundError({ title }))
					}

					const top = results.slice(0, topN)
					const result: RecommendationResult = { inputGame: title, recommendations: top }
					return result
				}),
		}
		return service
	}),
)

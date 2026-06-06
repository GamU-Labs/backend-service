import { Context, Effect, Layer, Schema } from 'effect'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { GameDataLayer, GameDataLayerLive, SimilarityEntry } from '../../data/games.js'

export class GameNotFoundError extends Schema.TaggedError<GameNotFoundError>()(
	'GameNotFoundError',
	{ title: Schema.String },
) {
	get message(): string {
		return `Game '${this.title}' tidak ditemukan di database.`
	}
}

export class ModelNotLoadedError extends Schema.TaggedError<ModelNotLoadedError>()(
	'ModelNotLoadedError',
	{ message: Schema.String },
) {}

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

export class RecommendationService extends Context.Tag('RecommendationService')<
	RecommendationService,
	RecommendationService
>() {}

export const RecommendationServiceLive: Layer.Layer<
	RecommendationService,
	never,
	FileSystem | Path
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
).pipe(Layer.provideMerge(GameDataLayerLive))

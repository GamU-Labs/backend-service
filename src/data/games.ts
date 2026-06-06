import { Context, Effect, Layer, ParseResult, Schema } from 'effect'
import { PlatformError } from '@effect/platform/Error'
import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'

export const GameDataEntrySchema = Schema.Struct({
	title: Schema.String,
	rating: Schema.String,
	desc_sentence: Schema.String,
	tags_clean: Schema.String,
})

export const GameDataSchema = Schema.Array(GameDataEntrySchema)

export type GameDataEntry = Schema.Schema.Type<typeof GameDataEntrySchema>
export type GameData = Schema.Schema.Type<typeof GameDataSchema>

export const SimilarityEntrySchema = Schema.Struct({
	title: Schema.String,
	rating: Schema.String,
	desc_sentence: Schema.String,
	tags_clean: Schema.String,
	similarity_score: Schema.Number,
})

export const SimilarityLookupSchema = Schema.Record({
	key: Schema.String,
	value: Schema.Array(SimilarityEntrySchema),
})

export type SimilarityEntry = Schema.Schema.Type<typeof SimilarityEntrySchema>
export type SimilarityLookup = Schema.Schema.Type<typeof SimilarityLookupSchema>

export interface GameDataLayer {
	readonly gamesData: GameData
	readonly similarityLookup: SimilarityLookup
}

export class GameDataLayer extends Context.Tag('GameDataLayer')<
	GameDataLayer,
	GameDataLayer
>() {}

const makeGameDataLayer = Effect.gen(function* () {
	const fs = yield* FileSystem
	const path = yield* Path

	const dataDir = path.join(process.cwd(), 'data')

	const [gamesRaw, similarityRaw] = yield* Effect.all(
		[
			fs.readFileString(path.join(dataDir, 'games_data.json')),
			fs.readFileString(path.join(dataDir, 'similarity_lookup.json')),
		],
		{ concurrency: 2 },
	)

	const sanitize = (raw: string) => raw.replace(/: NaN/g, ': ""')

	const [gamesData, similarityLookup] = yield* Effect.all(
		[
			Schema.decodeUnknown(GameDataSchema)(JSON.parse(sanitize(gamesRaw))),
			Schema.decodeUnknown(SimilarityLookupSchema)(JSON.parse(sanitize(similarityRaw))),
		],
		{ concurrency: 2 },
	)

	const layer: GameDataLayer = { gamesData, similarityLookup }
	return layer
})

export const GameDataLayerLive: Layer.Layer<
	GameDataLayer,
	PlatformError | ParseResult.ParseError,
	FileSystem | Path
> = Layer.effect(GameDataLayer, makeGameDataLayer)

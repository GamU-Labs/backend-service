// Aku mencintaimu, tapi mungkin aku tidak bisa bersamamu. Tapi "Mungkin" adalah kata yang sangat besar.
import { Effect, Layer } from 'effect'
import { SqliteClient } from '@effect/sql-sqlite-bun'
import { SqlClient } from '@effect/sql/SqlClient'

import { ConfigLayer } from './config/config.js'
import { GameDataLayer, GameDataLayerLive } from './data/games.js'
import { LlmCacheServiceLive } from './modules/llm/llm.cache.js'
import { LLMServiceLive } from './modules/llm/llm.service.js'
import { RecommendationServiceLive } from './modules/recommendation/recommendation.service.js'
import { RecommendationQueryServiceLive } from './modules/recommendation/recommendation-query.service.js'
import { SteamImageServiceLive } from './modules/steam/steam-image.service.js'

const SqliteLayer = SqliteClient.layer({ filename: 'data/steam_cache.db' })

const GameDataLayerSafe = GameDataLayerLive.pipe(
	Layer.catchAll((e) => Layer.effect(GameDataLayer, Effect.die(e))),
)

const RecLayer = RecommendationServiceLive.pipe(Layer.provide(GameDataLayerSafe))
const SteamImageLayer = SteamImageServiceLive.pipe(Layer.provide(SqliteLayer))

const CoreServices = Layer.mergeAll(
	RecLayer,
	LLMServiceLive,
	RecommendationQueryServiceLive,
	SteamImageLayer,
)

export const AppLayer = Layer.provideMerge(LlmCacheServiceLive, CoreServices).pipe(
	Layer.provideMerge(ConfigLayer),
)

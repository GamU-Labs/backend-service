import { Effect, Layer } from 'effect'

import { ConfigLayer } from './config/config.js'
import { GameDataLayer, GameDataLayerLive } from './data/games.js'
import { LlmCacheServiceLive } from './modules/llm/llm.cache.js'
import { LLMServiceLive } from './modules/llm/llm.service.js'
import { RecommendationServiceLive } from './modules/recommendation/recommendation.service.js'
import { RecommendationQueryServiceLive } from './modules/recommendation/recommendation-query.service.js'

const GameDataLayerSafe = GameDataLayerLive.pipe(
	Layer.catchAll((e) => Layer.effect(GameDataLayer, Effect.die(e))),
)

const RecLayer = RecommendationServiceLive.pipe(Layer.provide(GameDataLayerSafe))

const CoreServices = Layer.mergeAll(RecLayer, LLMServiceLive, RecommendationQueryServiceLive)

export const AppLayer = Layer.provideMerge(LlmCacheServiceLive, CoreServices).pipe(
	Layer.provideMerge(ConfigLayer),
)

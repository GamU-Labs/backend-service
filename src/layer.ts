import { Effect, Layer } from 'effect'

import { ConfigLayer } from './config/config.js'
import { GameDataLayer, GameDataLayerLive } from './data/games.js'
import { LLMServiceLive } from './modules/llm/llm.service.js'
import { RecommendationServiceLive } from './modules/recommendation/recommendation.service.js'

const GameDataLayerSafe = GameDataLayerLive.pipe(
	Layer.catchAll((e) => Layer.effect(GameDataLayer, Effect.die(e))),
)

const RecLayer = RecommendationServiceLive.pipe(Layer.provide(GameDataLayerSafe))

export const AppLayer = Layer.mergeAll(RecLayer, LLMServiceLive).pipe(
	Layer.provideMerge(ConfigLayer),
)

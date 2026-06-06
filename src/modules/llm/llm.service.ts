import { LanguageModel } from '@effect/ai'
import { GoogleClient, GoogleLanguageModel } from '@effect/ai-google'
import { OpenAiClient, OpenAiLanguageModel } from '@effect/ai-openai'
import { FetchHttpClient } from '@effect/platform'
import { Context, Effect, Layer, Redacted } from 'effect'

import { AppConfig } from '../../config/config.js'
import { LlmError } from '../../lib/errors.js'

export interface LLMService {
	readonly generateResponse: (prompt: string) => Effect.Effect<string, LlmError>
}

export const LLMService = Context.GenericTag<LLMService>('LLMService')

const makeGeminiLayer = (apiKey: string) =>
	GoogleLanguageModel.layer({
		model: 'gemini-3.1-flash-lite',
	}).pipe(
		Layer.provideMerge(GoogleClient.layer({ apiKey: Redacted.make(apiKey) })),
		Layer.provideMerge(FetchHttpClient.layer),
	)

const makeOpenAiLayer = (apiKey: string, baseUrl: string, model: string) =>
	OpenAiLanguageModel.layer({
		model,
	}).pipe(
		Layer.provideMerge(
			OpenAiClient.layer({
				apiKey: Redacted.make(apiKey),
				apiUrl: baseUrl,
			}),
		),
		Layer.provideMerge(FetchHttpClient.layer),
	)

export const LLMServiceLive = Layer.effect(
	LLMService,
	Effect.gen(function* () {
		const config = yield* AppConfig

		const geminiLayer = makeGeminiLayer(config.googleAiKey)
		const openaiLayer = makeOpenAiLayer(
			config.routerApiKey,
			config.routerBaseUrl,
			config.routerModel,
		)

		const service = {
			generateResponse: (prompt: string) => {
				const logGemini = Effect.logDebug(`LLM: trying Gemini`)
				const tryGemini = Effect.zipRight(
					logGemini,
					LanguageModel.generateText({ prompt })
						.pipe(Effect.map((r) => r.text))
						.pipe(Effect.provide(geminiLayer))
						.pipe(Effect.mapError((e) => new LlmError({ message: e.message }))),
				)

				const logOpenAI = Effect.logInfo(
					`LLM: Gemini failed, falling back to OpenRouter (${config.routerModel})`,
				)
				const tryOpenAI = Effect.zipRight(
					logOpenAI,
					LanguageModel.generateText({ prompt })
						.pipe(Effect.map((r) => r.text))
						.pipe(Effect.provide(openaiLayer))
						.pipe(Effect.mapError((e) => new LlmError({ message: e.message }))),
				)

				return Effect.catchAll(tryGemini, () => tryOpenAI)
			},
		}
		return service
	}),
)

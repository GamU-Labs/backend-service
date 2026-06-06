import { LanguageModel } from '@effect/ai'
import { GoogleClient, GoogleLanguageModel } from '@effect/ai-google'
import { OpenAiClient, OpenAiLanguageModel } from '@effect/ai-openai'
import { FetchHttpClient } from '@effect/platform'
import { Context, Effect, Layer, Redacted, Schema } from 'effect'

import { AppConfig } from '../../config/config.js'

export class LlmError extends Schema.TaggedError<LlmError>()('LlmError', {
	message: Schema.String,
	cause: Schema.optional(Schema.String),
}) {}

export interface LLMService {
	readonly generateResponse: (prompt: string) => Effect.Effect<string, LlmError>
}

export class LLMService extends Context.Tag('LLMService')<
	LLMService,
	LLMService
>() {}

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

		const service: LLMService = {
			generateResponse: (prompt: string) => {
				const tryGemini = LanguageModel.generateText({ prompt })
					.pipe(Effect.map((r) => r.text))
					.pipe(Effect.provide(geminiLayer))
					.pipe(Effect.mapError((e) => new LlmError({ message: e.message, cause: e._tag })))

				const tryOpenAI = LanguageModel.generateText({ prompt })
					.pipe(Effect.map((r) => r.text))
					.pipe(Effect.provide(openaiLayer))
					.pipe(Effect.mapError((e) => new LlmError({ message: e.message, cause: e._tag })))

				return Effect.catchAll(tryGemini, () => tryOpenAI)
			},
		}
		return service
	}),
)

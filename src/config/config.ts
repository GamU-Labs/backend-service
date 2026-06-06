import { Config, ConfigError, Context, Effect, Layer, Schema } from 'effect'

export const AppConfigSchema = Schema.Struct({
	databaseUrl: Schema.String,
	googleAiKey: Schema.String,
	routerApiKey: Schema.String,
	routerBaseUrl: Schema.String,
	routerModel: Schema.String,
	port: Schema.Number,
})

export type AppConfig = Schema.Schema.Type<typeof AppConfigSchema>

export const AppConfig = Context.GenericTag<AppConfig>('@capstone/AppConfig')

const appConfig: Config.Config<AppConfig> = Config.all({
	databaseUrl: Config.string('DATABASE_URL'),
	googleAiKey: Config.string('GOOGLE_AI_KEY'),
	routerApiKey: Config.string('ROUTER_API_KEY'),
	routerBaseUrl: Config.string('ROUTER_BASE_URL'),
	routerModel: Config.string('ROUTER_MODEL'),
	port: Config.number('PORT'),
})

export const ConfigLayer: Layer.Layer<AppConfig, ConfigError.ConfigError> = Layer.effect(
	AppConfig,
	Effect.gen(function* () {
		return yield* appConfig
	}),
)

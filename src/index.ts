import { Effect } from 'effect'

import { AppConfig, ConfigLayer } from './config/config.js'

const program = Effect.gen(function* () {
	const config = yield* AppConfig
	yield* Effect.logInfo(`Backend service ready (router model: ${config.routerModel})`)
})

Effect.runPromise(program.pipe(Effect.provide(ConfigLayer)))

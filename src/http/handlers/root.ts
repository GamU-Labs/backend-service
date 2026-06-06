import { HttpServerResponse } from '@effect/platform'

export const rootHandler = HttpServerResponse.json({
	name: 'GamU Backend Service',
	message: 'Welcome to the GamU Backend Service!',
	status: 'ok',
	version: '0.1.0',
})

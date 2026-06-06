import { HttpServerResponse } from '@effect/platform'

export const healthHandler = HttpServerResponse.json({
	status: 'healthy',
	service: 'gamu-backend',
	timestamp: new Date().toISOString(),
})

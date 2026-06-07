import { HttpServerResponse } from '@effect/platform'

export const healthHandler = HttpServerResponse.json({
	status: 'healthy',
	service: 'gamu-backend-v1',
	timestamp: new Date().toISOString(),
})

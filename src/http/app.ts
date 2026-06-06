import { HttpRouter, HttpServerResponse } from '@effect/platform'

import { healthHandler } from './handlers/health.js'
import { recommendHandler } from './handlers/recommend.js'
import { rootHandler } from './handlers/root.js'

const notFoundHandler = HttpServerResponse.json(
	{ status: 'error', code: 'NOT_FOUND', message: 'Endpoint not found' },
	{ status: 404 },
)

export const buildAppRouter = () =>
	HttpRouter.empty.pipe(
		HttpRouter.get('/', rootHandler),
		HttpRouter.get('/api/v1/healthcheck', healthHandler),
		HttpRouter.get('/recommend', recommendHandler),
		HttpRouter.catchTag('RouteNotFound', () => notFoundHandler),
	)

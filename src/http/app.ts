import { HttpRouter } from '@effect/platform'

import { healthHandler } from './handlers/health.js'
import { recommendHandler } from './handlers/recommend.js'
import { rootHandler } from './handlers/root.js'

export const buildAppRouter = () =>
	HttpRouter.empty.pipe(
		HttpRouter.get('/', rootHandler),
		HttpRouter.get('/api/v1/healthcheck', healthHandler),
		HttpRouter.get('/recommend', recommendHandler),
	)

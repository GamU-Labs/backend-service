import { HttpRouter } from '@effect/platform'

import { healthHandler } from './handlers/health.js'
import { recommendByTitleHandler } from './handlers/recommend.js'
import { recommendByQueryHandler } from './handlers/recommend-query.js'
import { rootHandler } from './handlers/root.js'

export const buildAppRouter = () =>
	HttpRouter.empty.pipe(
		HttpRouter.get('/api/v1', rootHandler),
		HttpRouter.get('/api/v1/healthcheck', healthHandler),
		HttpRouter.get('/api/v1/recommend', recommendByTitleHandler),
		HttpRouter.post('/api/v1/recommend', recommendByQueryHandler),
	)

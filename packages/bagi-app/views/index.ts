import { HygieneKernel } from '@rungsikorn/hygiene'
import * as next from 'next'
import config from '../next.config'
import { join } from 'path'

export type ViewConfig = {
  serverPort: number | string
}

export async function registerViewsHandler(kernel: HygieneKernel, viewConfig: ViewConfig) {
  const app = next({
    dir: join(__dirname),
    conf: config,
    dev: process.env.NODE_ENV === 'development'
  })
  if (!config.serverRuntimeConfig) {
    config.serverRuntimeConfig = {
      port: viewConfig.serverPort
    }
  }
  await app.prepare()
  kernel.registerHTTPResolver('get', '*', async (req, res) => {
    if (req.headers['content-type'] === 'application/json') {
      res.status(404).json({
        message: 'Not found'
      })
    } else {
      app.handleRequest(req, res)
    }
  })
}

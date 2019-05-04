import { Bagi2C2PService } from '@bagi/2c2p'
import * as Joi from 'joi'
import { HygieneKernel } from '@rungsikorn/hygiene'
import { createServer } from 'http'
import { registerViewsHandler } from './views'
import { CreditcardPayload } from './entities'

function getEnvOrThrow(key: string) {
  const value = process.env[key]
  if (!value) {
    throw new Error('Please provide ' + key + ' in ENV')
  }
  return value
}

function start() {
  const kernel = new HygieneKernel()
  const bagi2C2P = new Bagi2C2PService(getEnvOrThrow('BAGI_2C2P_MERCHANT_ID'), getEnvOrThrow('BAGI_2C2P_MERCHANT_SECRET'))
  bagi2C2P.loadPEM(getEnvOrThrow('BAGI_2C2P_MERCHANT_PEM_PATH'))
  bagi2C2P.setUseSandboxAPI()
  kernel.registerHTTPResolver('post', '/2c2p', async (req, res) => {
    if (req.query['method'] === 'creditcard') {
      const creditcardValidateSchema = Joi.object().keys({
        cardCVV: Joi.string()
          .max(3)
          .required(),
        cardNumber: Joi.string().required(),
        cardExpireMonth: Joi.string()
          .required()
          .max(2),
        cardExpireYear: Joi.string()
          .required()
          .length(4),

        cardHolderName: Joi.string().required(),
        cardHolderEmail: Joi.string().required(),
        description: Joi.string().required(),
        amount: Joi.number().required(),
        encryptedCreditcardData: Joi.string().required(),
        uniqueTransactionCode: Joi.string().required()
      })
      const { error, value } = Joi.validate<CreditcardPayload>(req.body, creditcardValidateSchema)
      if (error) {
        res.status(400).send({ error: error.message })
        return
      }
      const result = bagi2C2P.makeCreditcardS2BPaymentPayload(
        value.cardHolderName,
        value.cardHolderEmail,
        value.description,
        value.amount,
        value.encryptedCreditcardData,
        value.uniqueTransactionCode,
        JSON.stringify({ message: 'remark testing' })
      )
      res.json({
        token: result.message,
        url: result.url
      })
      return
    }
    res.json({ error: 'method not support' })
  })
  const PORT = process.env.PORT || '3000'
  registerViewsHandler(kernel, {
    serverPort: PORT
  })
  createServer(kernel.httpServ).listen(PORT, () => {
    console.log('Application start at :' + PORT)
  })
}

start()

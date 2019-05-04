import { generateEncryptedCreditcard } from './generate-encrypted'
import { Bagi2C2PService, CurrencyCode } from '..'
import { readFileSync } from 'fs'
import { join } from 'path'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
describe('2C2P service testing', () => {
  const bagi2c2p = new Bagi2C2PService('JT04', 'QnmrnH6QE23N')
  bagi2c2p.setCurrencyCode(CurrencyCode.THB)
  bagi2c2p.setCountry('TH')
  bagi2c2p.setUseSandboxAPI()
  bagi2c2p.loadConfigurationFromEnv()
  it('should create creditcard payload', async () => {
    const encryptedCreditcard = await generateEncryptedCreditcard()
    const payload = bagi2c2p.makeCreditcardS2BPaymentPayload(
      'rungsikorn rungsikavanich',
      'rungsikorn@me.com',
      'S1 best of Yui Hatano',
      1299,
      encryptedCreditcard,
      'payment-unique-id',
      'https://www.google.com'
    )
    // simulate redirect payment page
    const paymentResult = await bagi2c2p.submitPaymentPayload(payload)
    expect(paymentResult).not.toBeUndefined()
  })

  if (bagi2c2p.isPEMLoaded) {
    it('should able to decrypt response', async () => {
      const payload = readFileSync(join(__dirname, './payment-response.txt')).toString()
      const message = await bagi2c2p.decryptResponse(payload)
      expect(message).not.toBeUndefined()
      expect(message).toMatchSnapshot()
    })
  } else {
    console.warn('SKIP Decrypt testing, PEM key is not load')
    it.skip('should able to decrypt response', async () => {})
  }

  it.skip('should able to send s2s payment', async () => {
    const encryptedCreditcard = await generateEncryptedCreditcard()
    const payload = await bagi2c2p.makeCreditcardS2SPaymentPayload(
      'rungsikorn rungsikavanich',
      'S1 best of Yui Hatano',
      1299,
      encryptedCreditcard,
      'payment-unique-id'
    )
    //@ts-ignore
    const result = await bagi2c2p.submitPaymentPayload(payload)
  })
})

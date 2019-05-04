// import { Bagi2C2PService, CurrencyCode } from '..'
import { generateEncryptedCreditcard } from './generate-encrypted'
import { Bagi2C2PService, CurrencyCode } from '..'

describe('2C2P service testing', () => {
  const bagi2c2p = new Bagi2C2PService('JT04', 'QnmrnH6QE23N')
  bagi2c2p.setCurrencyCode(CurrencyCode.THB)
  bagi2c2p.setCountry('THAILAND')
  // it('should create creditcard payload', () => {
  //   // @ts-ignore
  //   console.log(m2c2p.getEncrypted('my-form'))
  //   const bagi2c2p = new Bagi2C2PService('JT04', 'QnmrnH6QE23N')
  //   bagi2c2p.setCurrencyCode(CurrencyCode.THB)
  //   bagi2c2p.setCountry('THAILAND')
  //   const result = bagi2c2p.makeCreditcardS2BPayment(
  //     'rungsikorn rungsikavanich',
  //     'rungsikorn@me.com',
  //     'S1 best of Yui Hatano',
  //     1299,
  //     'formEncryptedDataBy2C2PJavascript',
  //     'payment-unique-id',
  //     'https://www.google.com'
  //   )
  //   expect(result).toMatchSnapshot()
  // })

  it('should able to send s2s payment', async () => {
    const encryptedCreditcard = await generateEncryptedCreditcard()
    const payload = await bagi2c2p.makeCreditcardS2SPaymentPayload(
      'rungsikorn rungsikavanich',
      'rungsikorn@me.com',
      'S1 best of Yui Hatano',
      1299,
      encryptedCreditcard,
      'payment-unique-id'
    )
    const result = await bagi2c2p.submitCreditcardS2SPayment(payload)
    console.log(result)
  })
})

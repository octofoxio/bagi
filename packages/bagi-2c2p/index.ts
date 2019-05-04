import { hmac } from 'node-forge'
import fetch from 'node-fetch'
import * as FormData from 'form-data'
import { subCreditcardS2BTemplate, subCreditcardS2STemplate } from './entities'

interface Bagi2C2PCreditcardS2BResult {
  kind: 'creditcards2b'
  payload: string
  url: string
}
// interface Bagi2C2PCreditcardS2SResult {
//   kind: 'creditcards2s'
//   payload: string
// }
// interface Bagi2C2PInternetBankingPayload {
//   kind: 'internetbanking'
//   payload: string
// }
// type Bagi2C2PPayload = Bagi2C2PCreditcardS2BPayload | Bagi2C2PCreditcardS2SPayload | Bagi2C2PInternetBankingPayload

export enum CurrencyCode {
  THB = '764'
}

export class Bagi2C2PService {
  private country = 'TH'
  private currencyCode = CurrencyCode.THB
  private version: string = '9.9'

  private MERCHANT_ID: string
  private MERCHANT_SECRET: string

  private paymentURL = ''
  private s2spaymentURL = ''

  setUseSandboxAPI() {
    this.paymentURL = 'https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/PaymentAuth.aspx'
    this.s2spaymentURL = 'https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/Payment.aspx'
  }

  setUsePublicAPI() {
    this.paymentURL = 'https://s.2c2p.com/SecurePayment/PaymentAuth.aspx'
    this.s2spaymentURL = 'https://s.2c2p.com/SecurePayment/Payment.aspx'
  }

  public getPaymentURL() {
    return this.paymentURL
  }

  setCountry(value: string) {
    this.country = value
  }
  setCurrencyCode(value: CurrencyCode) {
    this.currencyCode = value
  }
  setVersion(value: string) {
    this.version = value
  }

  constructor(merchantId: string, merchantSecret: string) {
    this.MERCHANT_ID = merchantId
    this.MERCHANT_SECRET = merchantSecret
    this.setUsePublicAPI()
  }
  private format12DigitNumber(amount: number) {
    const to2Dot = amount.toFixed(2)
    const to2 = to2Dot.replace('.', '')
    const length = 12 - to2.length
    let amount12 = ''
    for (let i = 0; i < length; i++) {
      amount12 += '0'
    }
    amount12 = amount12 + to2
    return amount12
  }

  public makeCreditcardS2BPayment(
    cardHolderName: string,
    cardHolderEmail: string,
    description: string,
    amount: number,
    encryptedCreditcardData: string,
    uniqueTransactionCode: string,
    redirect: string
  ): Bagi2C2PCreditcardS2BResult {
    const amountIn12Digit = this.format12DigitNumber(amount)
    const signatureSeed = [
      this.version,
      this.MERCHANT_ID,
      uniqueTransactionCode,
      description,
      amountIn12Digit,
      this.currencyCode,
      this.country,
      cardHolderName,
      cardHolderEmail,
      redirect,
      encryptedCreditcardData
    ].join('')

    const xmlPayload = subCreditcardS2BTemplate({
      COUNTRY: this.country,
      MERCHANT_ID: this.MERCHANT_ID,
      version: this.version,
      currencyCode: this.currencyCode,
      hash: this.generateSignature(signatureSeed),
      amt: amountIn12Digit,
      cardholderEmail: cardHolderEmail,
      cardholderName: cardHolderName,
      desc: description,
      encryptedCardInfo: encryptedCreditcardData,
      redirect,
      uniqueTransactionCode
    })
    return {
      kind: 'creditcards2b',
      payload: new Buffer(xmlPayload).toString('base64'),
      url: this.paymentURL
    }
  }

  public makeCreditcardS2SPaymentPayload(
    cardHolderName: string,
    cardHolderEmail: string,
    description: string,
    amount: number,
    encryptedCreditcardData: string,
    uniqueTransactionCode: string
  ) {
    const amountIn12Digit = this.format12DigitNumber(amount)
    const signatureSeed = [
      this.version,
      this.MERCHANT_ID,
      uniqueTransactionCode,
      description,
      amountIn12Digit,
      this.currencyCode,
      this.country,
      cardHolderName,
      cardHolderEmail,
      encryptedCreditcardData
    ].join('')
    const signature = this.generateSignature(signatureSeed)

    const xmlPayload = subCreditcardS2STemplate({
      COUNTRY: this.country,
      MERCHANT_ID: this.MERCHANT_ID,
      version: this.version,
      currencyCode: this.currencyCode,
      amt: amountIn12Digit,
      cardholderName: cardHolderName,
      desc: description,
      encryptedCardInfo: encryptedCreditcardData,
      signature: signature,
      uniqueTransactionCode
    })
    return xmlPayload
  }

  public async submitCreditcardS2SPayment(payload: string) {
    const data = new FormData()
    data.append('paymentRequest', payload, {})
    const resp = await fetch(this.s2spaymentURL, {
      method: 'POST',
      body: data,
      redirect: 'manual'
    })
    console.log(resp.status)
    console.log(resp.headers)
    const result = await resp.text()
    return result
  }

  public makeInternetBankingPaymentPayload() {}

  // Generate new signature for
  public generateSignature(seed: string) {
    const h = hmac.create()
    h.start('sha1', this.MERCHANT_SECRET)
    h.update(seed)
    const hex = h.digest().toHex()
    return hex.toUpperCase()
  }
}

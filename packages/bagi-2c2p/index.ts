import { hmac, pki, pkcs7 } from 'node-forge'
import fetch from 'node-fetch'
import * as FormData from 'form-data'
import { subCreditcardS2BTemplate, subCreditcardS2STemplate } from './request-template'
import { load } from 'cheerio'
import { readFileSync } from 'fs'

interface Bagi2C2PCreditcardS2BPayload {
  kind: 'creditcards2b'
  message: string
  url: string
}

interface Bagi2C2PCreditcardS2SPayload {
  kind: 'creditcards2s'
  message: string
  url: string
}
type Bagi2C2PPayload = Bagi2C2PCreditcardS2BPayload | Bagi2C2PCreditcardS2SPayload

interface Bagi2C2ResultContent {
  merchantId: string
  transactionId: string
  remark: string
}

export enum CurrencyCode {
  THB = '764'
}

interface IBagi2C2PService {
  makeCreditcardS2BPaymentPayload(
    cardHolderName: string,
    cardHolderEmail: string,
    description: string,
    amount: number,
    encryptedCreditcardData: string,
    uniqueTransactionCode: string,
    remark: string
  ): Bagi2C2PCreditcardS2BPayload

  makeCreditcardS2SPaymentPayload(
    cardHolderName: string,
    description: string,
    amount: number,
    encryptedCreditcardData: string,
    uniqueTransactionCode: string
  ): Bagi2C2PCreditcardS2SPayload

  submitPaymentPayload(payload: Bagi2C2PPayload): Promise<string>
  decryptResponse(message: string): Promise<Bagi2C2ResultContent>
}

export class Bagi2C2PService implements IBagi2C2PService {
  private country = 'TH'
  private currencyCode = CurrencyCode.THB
  private version: string = '9.3'

  private MERCHANT_ID: string
  private MERCHANT_SECRET: string
  private MERCHANT_PEM_KEY: pki.PrivateKey | null = null
  public isPEMLoaded = false

  private paymentURL = ''
  private s2spaymentURL = ''

  loadConfigurationFromEnv() {
    this.MERCHANT_ID = process.env.BAGI_2C2P_MERCHANT_ID || this.MERCHANT_ID
    this.MERCHANT_SECRET = process.env.BAGI_2C2P_MERCHANT_SECRET || this.MERCHANT_SECRET
    const filePath = process.env.BAGI_2C2P_MERCHANT_PEM_PATH
    if (filePath) {
      this.loadPEM(filePath)
    }
  }

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
  loadPEM(pathToPEM: string) {
    console.info('load pem key file from ', pathToPEM)
    const file = readFileSync(pathToPEM).toString()
    const key = pki.decryptRsaPrivateKey(file, '2c2p')
    this.MERCHANT_PEM_KEY = key
    this.isPEMLoaded = true
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

  public makeCreditcardS2BPaymentPayload(
    cardHolderName: string,
    cardHolderEmail: string,
    description: string,
    amount: number,
    encryptedCreditcardData: string,
    uniqueTransactionCode: string,
    remark: string
  ): Bagi2C2PCreditcardS2BPayload {
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
      remark,
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
      remark: remark,
      uniqueTransactionCode
    })
    return {
      kind: 'creditcards2b',
      message: new Buffer(xmlPayload).toString('base64'),
      url: this.paymentURL
    }
  }

  public makeCreditcardS2SPaymentPayload(
    cardHolderName: string,
    description: string,
    amount: number,
    encryptedCreditcardData: string,
    uniqueTransactionCode: string
  ): Bagi2C2PCreditcardS2SPayload {
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
    const b = new Buffer(xmlPayload).toString('base64')
    return {
      kind: 'creditcards2s',
      message: encodeURI(b),
      url: this.s2spaymentURL
    }
  }

  public async submitPaymentPayload(payload: Bagi2C2PPayload): Promise<string> {
    if (payload.kind === 'creditcards2b') {
      const data = new FormData()
      data.append('paymentRequest', payload.message, {})
      const resp = await fetch(payload.url, {
        method: 'POST',
        body: data
      })
      const t = await resp.text()
      const $ = load(t)
      return $('#paymentRequest').val()
    } else if (payload.kind === 'creditcards2s') {
      throw new Error('method s2s in unvaliable')
      // const data = new FormData()
      // data.append('paymentRequest', payload.message, {})
      // const resp = await fetch(payload.url, {
      //   method: 'POST',
      //   body: data
      // })
      // const t = await resp.text()
      // return t
    }
    throw new Error('method not support')
  }

  public async decryptResponse(message: string): Promise<Bagi2C2ResultContent> {
    if (this.MERCHANT_PEM_KEY === null) {
      throw new Error('Please load merchant private key file before use decryptResponse')
    }
    const messageToPEM = '-----BEGIN PKCS7-----\n' + message + '-----END PKCS7-----'
    // @ts-ignore: no type definition for this function
    const p7 = pkcs7.messageFromPem(messageToPEM)
    p7.decrypt(p7.recipients[0], this.MERCHANT_PEM_KEY)
    const responseContent = p7.content.toString('utf-8')
    const $ = load(responseContent, {
      xmlMode: true
    })
    return {
      merchantId: $('PaymentResponse merchantID').text(),
      remark: $('PaymentResponse userDefined1').text(),
      transactionId: $('PaymentResponse uniqueTransactionCode').text()
    }
  }

  // Generate new hash signature for message
  private generateSignature(seed: string) {
    const h = hmac.create()
    h.start('sha1', this.MERCHANT_SECRET)
    h.update(seed)
    const hex = h.digest().toHex()
    return hex.toUpperCase()
  }
}

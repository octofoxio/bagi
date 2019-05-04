import { readFileSync } from 'fs'
import { join } from 'path'

export function subCreditcardS2STemplate(data: {
  version: string
  MERCHANT_ID: string
  uniqueTransactionCode: string
  desc: string
  amt: string
  currencyCode: string
  COUNTRY: string
  cardholderName: string
  encryptedCardInfo: string
  signature: string
}) {
  const template = readFileSync(join(__dirname, './creditcards2s-payment-request.xml')).toString()
  const result = Object.keys(data).reduce((prev, current) => {
    const reg = new RegExp(`\\$\\{${current}\\}`, 'gm')
    return prev.replace(reg, data[current])
  }, template)
  const payload = new Buffer(result).toString('base64')
  const wrappedPayload = `
  <PaymentRequest>
    <version>${data.version}</version>
    <payload>${payload}</payload>
    <signature>${data.signature}</signature>
  </PaymentRequest>
  `
  return wrappedPayload
}
export function subCreditcardS2BTemplate(data: {
  version: string
  MERCHANT_ID: string
  uniqueTransactionCode: string
  desc: string
  amt: string
  currencyCode: string
  COUNTRY: string
  cardholderName: string
  cardholderEmail: string
  encryptedCardInfo: string
  remark: string
  hash: string
}) {
  const template = readFileSync(join(__dirname, './creditcard-payment-request.xml')).toString()
  const result = Object.keys(data).reduce((prev, current) => {
    const reg = new RegExp(`\\$\\{${current}\\}`, 'gm')
    return prev.replace(reg, data[current])
  }, template)
  return result
}

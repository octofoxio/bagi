export type CreditcardPayload = {
  cardNumber: string
  cardExpireMonth: string
  cardExpireYear: string
  cardCVV: string

  cardHolderName: string
  cardHolderEmail: string
  description: string
  amount: number
  encryptedCreditcardData: string
  uniqueTransactionCode: string
}

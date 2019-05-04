import * as React from 'react'
import { majorScale, Pane, TextInputField, Heading, Button } from 'evergreen-ui'
import { CreditcardPayload } from '../../entities'
import Head from 'next/head'

function usePaymentService() {
  const [loading, setLoading] = React.useState<boolean>(false)
  const [creditcardInfo, setCreditcardInfo] = React.useState<CreditcardPayload>({
    amount: 900,
    cardHolderEmail: 'test',
    cardHolderName: 'test',
    description: 'test',
    encryptedCreditcardData: '',
    uniqueTransactionCode: new Date().getTime() + '',
    cardCVV: '123',
    cardExpireMonth: '02',
    cardExpireYear: '2080',
    cardNumber: '4111111111111111'
  })
  const [paymentPayload, setPaymentPayload] = React.useState<string | null>(null)

  async function generatePaymentBody(data: CreditcardPayload) {
    const resp = await fetch('/2c2p?method=creditcard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    const result = await resp.json()
    setPaymentPayload(result.token)
  }

  return {
    paymentPayload,
    loading,
    submit: () => {
      // @ts-ignore: My2c2p is global declare from <script> import
      My2c2p.getEncrypted('2c2p-payment-form', function(encryptedData, errCode, errDesc) {
        console.log(encryptedData, errCode, errDesc)
        const data = {
          ...creditcardInfo,
          encryptedCreditcardData: encryptedData.encryptedCardInfo
        }
        setCreditcardInfo(data)
        generatePaymentBody(data).then(() => setLoading(false))
      })
    },
    creditcardInfo,
    onChangeCreditcardInfo: (fieldName: keyof CreditcardPayload) => {
      return e => {
        setCreditcardInfo({
          ...creditcardInfo,
          [fieldName]: e.target.value
        })
      }
    }
  }
}

const CreditcardInput = props => <TextInputField {...props} label={props.placeholder} display={'block'} marginY={majorScale(2)} />
export default () => {
  const { onChangeCreditcardInfo, creditcardInfo, submit, paymentPayload } = usePaymentService()
  return (
    <>
      <Head>
        <script type="text/javascript" src="https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/api/my2c2p.1.6.9.min.js" />
      </Head>
      <Pane elevate={1}>
        <Heading margin={'default'} size={700}>
          {'2C2P payment demo'}
        </Heading>
        <form action="https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/PaymentAuth.aspx" method="POST" name="paymentRequestForm">
          <input type="hidden" value={paymentPayload || ''} name="paymentRequest" />
          <input type="submit" value="go" />
        </form>
        <form
          id="2c2p-payment-form"
          method="POST"
          onSubmit={e => {
            e.preventDefault()
          }}
        >
          <CreditcardInput
            value={creditcardInfo.cardHolderEmail}
            onChange={onChangeCreditcardInfo('cardHolderEmail')}
            placeholder={'Email'}
          />
          <CreditcardInput
            value={creditcardInfo.cardHolderName}
            onChange={onChangeCreditcardInfo('cardHolderName')}
            placeholder={'Name'}
          />

          <CreditcardInput
            value={creditcardInfo.description}
            onChange={onChangeCreditcardInfo('description')}
            placeholder={'Description'}
          />

          <CreditcardInput
            type="number"
            value={creditcardInfo.amount}
            onChange={onChangeCreditcardInfo('amount')}
            placeholder={'Amount'}
          />

          <CreditcardInput
            value={creditcardInfo.cardNumber}
            onChange={onChangeCreditcardInfo('cardNumber')}
            placeholder={'Creditcard number'}
            data-encrypt="cardnumber"
          />

          <CreditcardInput
            value={creditcardInfo.cardExpireMonth}
            onChange={onChangeCreditcardInfo('cardExpireMonth')}
            placeholder={'Expire month'}
            maxLength={'2'}
            data-encrypt="month"
          />

          <CreditcardInput
            value={creditcardInfo.cardExpireYear}
            onChange={onChangeCreditcardInfo('cardExpireYear')}
            placeholder={'Expire year (4 Digit)'}
            maxLength={'4'}
            data-encrypt="year"
          />
          <CreditcardInput
            data-encrypt="cvv"
            value={creditcardInfo.cardCVV}
            onChange={onChangeCreditcardInfo('cardCVV')}
            placeholder={'CVV'}
          />
          <Button onClick={submit}>{'Submit'}</Button>
        </form>
      </Pane>
    </>
  )
}

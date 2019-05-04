## Require internet connection ⚠️

## Test with your credential

```
export BAGI_2C2P_MERCHANT_ID=<your merchant ID>
export BAGI_2C2P_MERCHANT_SECRET=<your merchant secret>

## PEM key must match with `payment-response.txt` or test will fail
export BAGI_2C2P_MERCHANT_PEM_PATH=<path to pem file>

yarn jest --config jest.config.json
```

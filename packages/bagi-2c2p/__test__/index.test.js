"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
describe('2C2P service testing', () => {
    it('should create creditcard payload', () => {
        const bagi2c2p = new __1.Bagi2C2PService('MERCHANT_ID_TEST', 'MERCHANT_SECRET_TEST');
        const result = bagi2c2p.makeCreditcardPaymentPayload('rungsikorn rungsikavanich', 'rungsikorn@me.com', 'S1 best of Yui Hatano', 1299, 'formEncryptedDataBy2C2PJavascript', 'payment-unique-id', 'https://www.google.com');
        expect(result).toMatchSnapshot();
    });
});
//# sourceMappingURL=index.test.js.map
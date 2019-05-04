"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_forge_1 = require("node-forge");
const fs_1 = require("fs");
const path_1 = require("path");
const node_fetch_1 = require("node-fetch");
const FormData = require("form-data");
function subCreditcardTemplate(data) {
    const template = fs_1.readFileSync(path_1.join(__dirname, './creditcard-payment-request.xml')).toString();
    const result = Object.keys(data).reduce((prev, current) => {
        const reg = new RegExp(`\\$\\{${current}\\}`, 'gm');
        return prev.replace(reg, data[current]);
    }, template);
    return result;
}
var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["THB"] = "764";
})(CurrencyCode = exports.CurrencyCode || (exports.CurrencyCode = {}));
class Bagi2C2PService {
    constructor(merchantId, merchantSecret) {
        this.country = 'TH';
        this.currencyCode = CurrencyCode.THB;
        this.version = '9.3';
        this.paymentURL = '';
        this.s2spaymentURL = '';
        this.MERCHANT_ID = merchantId;
        this.MERCHANT_SECRET = merchantSecret;
        this.setUsePublicAPI();
    }
    setUseSandboxAPI() {
        this.paymentURL = 'https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/PaymentAuth.aspx';
        this.s2spaymentURL = 'https://demo2.2c2p.com/2C2PFrontEnd/SecurePayment/Payment.aspx';
    }
    setUsePublicAPI() {
        this.paymentURL = 'https://s.2c2p.com/SecurePayment/PaymentAuth.aspx';
        this.s2spaymentURL = 'https://s.2c2p.com/SecurePayment/Payment.aspx';
    }
    setCountry(value) {
        this.country = value;
    }
    setCurrencyCode(value) {
        this.currencyCode = value;
    }
    setVersion(value) {
        this.version = value;
    }
    format12DigitNumber(amount) {
        const to2Dot = amount.toFixed(2);
        const to2 = to2Dot.replace('.', '');
        const length = 12 - to2.length;
        let amount12 = '';
        for (let i = 0; i < length; i++) {
            amount12 += '0';
        }
        amount12 = amount12 + to2;
        return amount12;
    }
    makeCreditcardPaymentPayload(cardHolderName, cardHolderEmail, description, amount, encryptedCreditcardData, uniqueTransactionCode, redirect) {
        const amountIn12Digit = this.format12DigitNumber(amount);
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
        ].join('');
        const xmlPayload = subCreditcardTemplate({
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
        });
        return new Buffer(xmlPayload).toString('base64');
    }
    getPaymentURL() {
        return this.paymentURL;
    }
    submitPayment(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = new FormData();
            data.append('paymentRequest', payload, {});
            const resp = yield node_fetch_1.default(this.s2spaymentURL, {
                method: 'POST',
                body: data,
                redirect: 'manual'
            });
            console.log(resp.status);
            console.log(resp.headers);
            const result = yield resp.text();
            console.log(result);
        });
    }
    makeInternetBankingPaymentPayload() { }
    // Generate new signature for
    generateSignature(payload) {
        const h = node_forge_1.hmac.create();
        h.start('sha1', this.MERCHANT_SECRET);
        h.update(payload);
        const hex = h.digest().toHex();
        return hex.toUpperCase();
    }
}
exports.Bagi2C2PService = Bagi2C2PService;
//# sourceMappingURL=index.js.map
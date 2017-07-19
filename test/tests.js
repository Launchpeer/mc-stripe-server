const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const stripeKey = 'sk_test_sXronegNTprnMMpFprqAJihg';
const stripe = require('stripe')(stripeKey);
const stripeI = require('../index');
describe('Stripe Interface Tests', () => {
  it('should create a stripe customer', (done) => {
    let i = new stripeI(stripeKey);
    createStripeToken()
    .then(token => {
      return i.createCustomer('123abc', token.id);
    })
    .then(customer => {
      expect(customer.sources.data.length).to.be.equal(1);
      done();
    })
    .catch(err => {
      expect.fail(err.message, 'no error');
      done();
    });
  });
});

function createStripeToken() {
  return new Promise((resolve, reject) => {
    stripe.tokens.create({
      card: {
        "number": '4242424242424242',
        "exp_month": 12,
        "exp_year": 2018,
        "cvc": '123'
      }}, (err, token) => {
        if(err) return reject(err);
        return resolve(token);
      });
  });
}

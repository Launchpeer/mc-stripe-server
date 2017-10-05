const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const random = require('randomstring');
const stripeKey = 'sk_test_sXronegNTprnMMpFprqAJihg';
const stripe = require('stripe')(stripeKey);
const stripeI = require('../index');
const StripeInterface = new stripeI(stripeKey);
describe('Stripe Interface Tests', () => {
  it('should create a stripe customer', (done) => {
    createStripeToken()
    .then(token => {
      return StripeInterface.createCustomer('123abc', token.id);
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

  it('should update a customers payment information', (done) => {
    var req = new Object();
    createStripeCustomer()
    .then(customer => {
      req.customer = customer;
      req.prevCard = customer.sources.data[0];
      return createStripeToken();
    })
    .then(token => {
      req.token = token;
      return StripeInterface.updateCustomer(req.customer.id, token.id);
    })
    .then(customer => {
      expect(customer.sources.data.length).to.equal(1);
      let curCard = customer.sources.data[0];
      expect(curCard.id).to.not.equal(req.prevCard.id);
      done();
    })
    .catch(err => {
      console.log(err);
      expect.fail(err, null, 'expected stripe to update the customer information', null);
      done();
    })
  }).timeout(5000);

  it('it should list all available plans on stripe', (done) => {
    StripeInterface.createPlan(`Test Plan ${random.generate(5)}`, 5000, 'month', 1)
    .then(plan => {
      return StripeInterface.listPlans()
    })
    .then(plans => {
      expect(plans.data.length).to.be.greaterThan(0);
      done();
    });
  });

  it('it should retrieve all upcoming invoices for a specified customer', (done) => {
    var curCustomer;
    createStripeCustomer()
    .then(customer => {
      curCustomer = customer;
      return StripeInterface.createPlan(`Test Plan ${random.generate(5)}`, 5000, 'month', 1);
    })
    .then(plan => {
      return StripeInterface.createSubscription(curCustomer.id, plan.id, 2);
    })
    .then(sub => {
      return StripeInterface.getUpcomingInvoices(curCustomer.id);
    })
    .then(invoices => {
      expect(invoices.lines.data.length).to.equal(1);
      done();
    });
  }).timeout(5000);

  it('it should create a invalid customized plan on stripe', (done) => {
    var curPlan;
    StripeInterface.createPlan('My Awesome Test Plan', 4500, 'invalid_interval_time', 1)
    .then(plan => {
      expect.fail('plan created', 'plan not created error thrown due to invalid time span');
      done();
    })
    .catch(err => {
      expect(err).to.not.be.null;
      done();
    });
  });

  it('it should create a customized plan on stripe', (done) => {
    var curPlan;
    StripeInterface.createPlan('My Awesome Test Plan', 4500, 'month', 1)
    .then(plan => {
      curPlan = plan;
      return StripeInterface.deletePlan(plan.id);
    })
    .then(confirmation => {
      expect(confirmation.id).to.equal(curPlan.id);
      done();
    })
    .catch(err => {
      expect.fail('error making plan', 'no error making plan');
      done();
    });
  });

  it('it should remove the customer and cancel subscriptions', (done) => {
    var curSubscription;
    var curCustomer;
    var curPlan;
    StripeInterface.createPlan(`Test Plan ${random.generate(5)}`, 5000, 'month', 1)
    .then(plan => {
      curPlan = plan;
      return createStripeCustomer()
    })
    .then(customer => {
      curCustomer = customer;
      return StripeInterface.createSubscription(customer.id, curPlan.id, 1);
    })
    .then(subscription => {
      curSubscription = subscription;
      return StripeInterface.deleteCustomer(curCustomer.id);
    })
    .then(customer => {
      return StripeInterface.findSubscription(curSubscription.id);
    })
    .then(subscription => {
      expect(subscription.status).to.equal('canceled');
      done();
    });
  }).timeout(5000);

  it('it should cancel the customer subscription', (done) => {
    var curSubscription;
    var curCustomer;
    var curPlan;
    StripeInterface.createPlan(`Test Plan ${random.generate(5)}`, 5000, 'month', 1)
    .then(plan => {
      curPlan = plan;
      return createStripeCustomer()
    })
    .then(customer => {
      curCustomer = customer;
      return StripeInterface.createSubscription(customer.id, curPlan.id, 1);
    })
    .then(subscription => {
      return StripeInterface.removeSubscription(subscription.id)
    })
    .then(subscrption => {
      expect(subscrption.status).to.equal('canceled');
      done();
    });
  }).timeout(5000);
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

// helper function used to create a customer and add payment in one fell swoop
function createStripeCustomer() {
  return new Promise((resolve, reject) => {
    createStripeToken()
    .then(token => {
      return StripeInterface.createCustomer('abc123', token.id);
    })
    .then(customer => {
      return resolve(customer);
    })
    .catch(err => { return reject(err); });
  });
}
